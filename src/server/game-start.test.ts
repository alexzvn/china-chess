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

describe("Game start flow", () => {
  it("joins a room, both confirm, game starts with colors", async () => {
    const a = await createClient()
    const b = await createClient()
    await a.waitFor((m) => m.includes('"type":"connected"'))
    await b.waitFor((m) => m.includes('"type":"connected"'))

    a.ws.send(JSON.stringify({ action: "createRoom" }))
    const roomCreated = await a.waitFor((m) =>
      m.includes('"type":"roomCreated"'),
    )
    const { roomId } = JSON.parse(roomCreated)

    b.ws.send(JSON.stringify({ action: "joinRoom", roomId }))

    await a.waitFor((m) => m.includes('"type":"roomJoined"'))
    await b.waitFor((m) => m.includes('"type":"roomJoined"'))

    a.ws.send(JSON.stringify({ action: "startGame", roomId }))
    b.ws.send(JSON.stringify({ action: "startGame", roomId }))

    const aStart = await a.waitFor((m) => m.includes('"type":"gameStart"'))
    const bStart = await b.waitFor((m) => m.includes('"type":"gameStart"'))

    const aData = JSON.parse(aStart)
    const bData = JSON.parse(bStart)

    expect(aData.type).toBe("gameStart")
    expect(aData.roomId).toBe(roomId)
    expect(["red", "black"]).toContain(aData.yourColor)

    expect(bData.type).toBe("gameStart")
    expect(bData.roomId).toBe(roomId)
    expect(["red", "black"]).toContain(bData.yourColor)

    expect(aData.yourColor).not.toBe(bData.yourColor)

    // Game room should no longer appear in lobby
    a.messages.length = 0
    a.ws.send(JSON.stringify({ action: "joinLobby" }))
    const lobbyUpdate = await a.waitFor((m) => m.includes('"type":"lobbyUpdate"'))
    const lobby = JSON.parse(lobbyUpdate)
    expect(lobby.rooms.find((r: { roomId: string }) => r.roomId === roomId)).toBeUndefined()

    a.ws.close()
    b.ws.close()
  })

  it("rejects joining a non-existent room", async () => {
    const c = await createClient()
    await c.waitFor((m) => m.includes('"type":"connected"'))

    c.ws.send(JSON.stringify({ action: "joinRoom", roomId: "nonexist" }))
    const raw = await c.waitFor((m) => m.includes('"type":"error"'))
    const err = JSON.parse(raw)
    expect(err.message).toBeDefined()

    c.ws.close()
  })
})
