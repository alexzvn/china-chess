import { describe, it, expect, beforeAll } from "bun:test"
import { createApp } from "./index"

let port = 0

interface TestClient {
  ws: WebSocket
  messages: string[]
  waitFor: (filter?: (msg: string) => boolean) => Promise<string>
}

function createClient(): Promise<TestClient> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`)
    const messages: string[] = []
    const listeners: Array<(msg: string) => void> = []

    ws.onmessage = (e) => {
      const text = e.data as string
      messages.push(text)
      for (const fn of listeners) fn(text)
    }

    ws.onopen = () =>
      resolve({
        ws,
        messages,
        waitFor: (filter?) =>
          new Promise((res, rej) => {
            const match = filter ? messages.find(filter) : messages.at(-1)
            if (match) return res(match)

            const handler = (msg: string) => {
              if (!filter || filter(msg)) {
                const idx = listeners.indexOf(handler)
                if (idx !== -1) listeners.splice(idx, 1)
                res(msg)
              }
            }
            listeners.push(handler)
            setTimeout(() => {
              const idx = listeners.indexOf(handler)
              if (idx !== -1) listeners.splice(idx, 1)
              rej(new Error("Message timeout"))
            }, 5000)
          }),
      })

    ws.onerror = () => reject(new Error("WS connection failed"))
    setTimeout(() => reject(new Error("WS connect timeout")), 3000)
  })
}

beforeAll(() => {
  const app = createApp()
  app.listen(0)
  const server = app.server
  if (!server) throw new Error("Server failed to start")
  port = server.port
})

describe("Reconnection after SPA navigation", () => {
  it("reclaimRoom with original clientId updates server mapping and responds", async () => {
    // Setup: creator creates room
    const creator = await createClient()
    const cMsg = await creator.waitFor((m) => m.includes('"type":"connected"'))
    const originalClientId = JSON.parse(cMsg).clientId

    creator.ws.send(JSON.stringify({ action: "createRoom" }))
    const createResp = await creator.waitFor((m) => m.includes('"type":"roomCreated"'))
    const roomId = JSON.parse(createResp).roomId

    // Simulate disconnect-then-reconnect
    creator.ws.close()
    await new Promise((r) => setTimeout(r, 50))

    const reconnected = await createClient()
    const connectedMsg = await reconnected.waitFor((m) => m.includes('"type":"connected"'))
    const newClientId = JSON.parse(connectedMsg).clientId
    expect(newClientId).not.toBe(originalClientId)

    // Register listener before sending reclaimRoom
    const reclaimPromise = reconnected.waitFor((m) =>
      m.includes('"type":"roomReclaimed"') || m.includes('"type":"error"')
    )
    reconnected.ws.send(JSON.stringify({
      action: "reclaimRoom", roomId, originalClientId,
    }))
    const reclaimResponse = await reclaimPromise
    const parsed = JSON.parse(reclaimResponse)
    expect(parsed.type).toBe("roomReclaimed")
    expect(parsed.role).toBe("playerA")

    // Verify the reconnected user can now play: join opponent and start game
    const opponent = await createClient()
    await opponent.waitFor((m) => m.includes('"type":"connected"'))

    opponent.ws.send(JSON.stringify({ action: "joinRoom", roomId }))
    await opponent.waitFor((m) => m.includes('"type":"roomUpdate"'))

    // Both ready
    const startPromise = reconnected.waitFor((m) => m.includes('"type":"gameStart"'))
    reconnected.ws.send(JSON.stringify({ action: "toggleReady", roomId }))
    opponent.ws.send(JSON.stringify({ action: "toggleReady", roomId }))

    const startMsg = await startPromise
    expect(JSON.parse(startMsg).type).toBe("gameStart")

    reconnected.ws.close()
    opponent.ws.close()
  })

  it("allows playerB to reclaim their spot after disconnect", async () => {
    // Room creator stays connected, playerB disconnects and reclaims
    const creator = await createClient()
    await creator.waitFor((m) => m.includes('"type":"connected"'))

    creator.ws.send(JSON.stringify({ action: "createRoom" }))
    const roomCreated = await creator.waitFor((m) => m.includes('"type":"roomCreated"'))
    const { roomId } = JSON.parse(roomCreated)

    // PlayerB connects, joins, then disconnects
    const playerB = await createClient()
    await playerB.waitFor((m) => m.includes('"type":"connected"'))
    const bConnected = playerB.messages.find((m) => m.includes('"type":"connected"'))!
    const bOriginalId = JSON.parse(bConnected).clientId

    playerB.ws.send(JSON.stringify({ action: "joinRoom", roomId }))
    await playerB.waitFor((m) => m.includes('"type":"roomUpdate"'))

    // Start game
    creator.ws.send(JSON.stringify({ action: "toggleReady", roomId }))
    playerB.ws.send(JSON.stringify({ action: "toggleReady", roomId }))
    await creator.waitFor((m) => m.includes('"type":"gameStart"'))
    await playerB.waitFor((m) => m.includes('"type":"gameStart"'))

    // PlayerB disconnects
    playerB.ws.close()

    // PlayerB reconnects and reclaims
    const bReconnected = await createClient()
    await bReconnected.waitFor((m) => m.includes('"type":"connected"'))

    const reclaimPromise = bReconnected.waitFor((m) =>
      m.includes('"type":"roomReclaimed"') || m.includes('"type":"error"')
    )
    bReconnected.ws.send(JSON.stringify({
      action: "reclaimRoom", roomId, originalClientId: bOriginalId,
    }))

    const reclaimResp = await reclaimPromise
    expect(JSON.parse(reclaimResp).type).toBe("roomReclaimed")
    expect(JSON.parse(reclaimResp).role).toBe("playerB")

    // Verify gets game state
    const update = await bReconnected.waitFor((m) => m.includes('"type":"boardUpdate"'))
    expect(update).toBeDefined()

    creator.ws.close()
    bReconnected.ws.close()
  })
})
