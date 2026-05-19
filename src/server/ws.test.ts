import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { createApp } from "./index"

let port = 0

beforeAll(() => {
  const app = createApp()
  app.listen(0)
  if (!app.server) throw new Error("Server failed to start")
  port = app.server.port
})

afterAll(() => {
  // Cleanup handled by test process teardown
})

function nextMessage(
  ws: WebSocket,
  filter?: (msg: string) => boolean,
): Promise<string> {
  return new Promise((resolve, reject) => {
    function onMsg(e: Event) {
      const msg = (e as MessageEvent).data as string
      if (!filter || filter(msg)) {
        ws.removeEventListener("message", onMsg)
        resolve(msg)
      }
    }
    ws.addEventListener("message", onMsg)
    setTimeout(() => {
      ws.removeEventListener("message", onMsg)
      reject(new Error("Message timeout"))
    }, 3000)
  })
}

describe("WebSocket /ws", () => {
  it("connects and receives clientId", async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`)

    const raw = await nextMessage(ws)
    const msg = JSON.parse(raw)
    expect(msg.type).toBe("connected")
    expect(msg.clientId).toMatch(/^[a-zA-Z0-9_-]{7}$/)
    ws.close()
  })

  it("responds to ping with pong", async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`)
    await nextMessage(ws)

    ws.send(JSON.stringify({ type: "ping" }))
    const raw = await nextMessage(ws)
    const msg = JSON.parse(raw)
    expect(msg.type).toBe("pong")
    ws.close()
  })

  it("assigns unique clientIds to different connections", async () => {
    const ws1 = new WebSocket(`ws://localhost:${port}/ws`)
    const ws2 = new WebSocket(`ws://localhost:${port}/ws`)

    const [raw1, raw2] = await Promise.all([
      nextMessage(ws1),
      nextMessage(ws2),
    ])

    const msg1 = JSON.parse(raw1)
    const msg2 = JSON.parse(raw2)
    expect(msg1.clientId).not.toBe(msg2.clientId)
    ws1.close()
    ws2.close()
  })

  it("kickPlayer resets room and notifies both players", async () => {
    const hostWs = new WebSocket(`ws://localhost:${port}/ws`)
    const guestWs = new WebSocket(`ws://localhost:${port}/ws`)

    const [hostRaw, guestRaw] = await Promise.all([
      nextMessage(hostWs),
      nextMessage(guestWs),
    ])
    const hostMsg = JSON.parse(hostRaw)
    const guestMsg = JSON.parse(guestRaw)
    const hostId = hostMsg.clientId
    const guestId = guestMsg.clientId

    // Host creates room
    hostWs.send(JSON.stringify({ action: "createRoom" }))
    let created = await nextMessage(hostWs, (m) => {
      const p = JSON.parse(m)
      return p.type === "roomCreated"
    })
    const roomId = JSON.parse(created).roomId

    // Guest joins room
    guestWs.send(JSON.stringify({ action: "joinRoom", roomId }))
    await nextMessage(guestWs, (m) => {
      const p = JSON.parse(m)
      return p.type === "roomUpdate"
    })

    // Host kicks guest
    hostWs.send(JSON.stringify({ action: "kickPlayer", roomId }))

    // Guest receives kicked message
    const kickedRaw = await nextMessage(guestWs, (m) => {
      const p = JSON.parse(m)
      return p.type === "kicked"
    })
    const kickedMsg = JSON.parse(kickedRaw)
    expect(kickedMsg.type).toBe("kicked")

    // Host receives roomUpdate with only themselves
    const hostUpdateRaw = await nextMessage(hostWs, (m) => {
      const p = JSON.parse(m)
      return p.type === "roomUpdate"
    })
    const hostUpdate = JSON.parse(hostUpdateRaw)
    expect(hostUpdate.type).toBe("roomUpdate")
    expect(hostUpdate.players.length).toBe(1)
    expect(hostUpdate.players[0].clientId).toBe(hostId)
    expect(hostUpdate.roomStatus).toBe("waiting")

    hostWs.close()
    guestWs.close()
  })

  // Rematch WebSocket tests are covered by room-level tests in rooms.test.ts
  // The rematch action handler is implemented and verified manually
})
