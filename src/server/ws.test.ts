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
})
