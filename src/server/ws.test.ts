import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { createApp } from "./index"

let app: ReturnType<typeof createApp>
let port: number

beforeAll(() => {
  app = createApp()
  app.listen(0)
  port = app.server!.port
})

afterAll(() => {
  app.stop()
})

/**
 * Wait for the next WebSocket message.
 * If `filter` is provided, keeps listening until a message matches.
 */
function nextMessage(
  ws: WebSocket,
  filter?: (msg: string) => boolean,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const handler = (e: { data: string }) => {
      if (!filter || filter(e.data)) {
        ws.removeEventListener("message", handler as EventListener)
        resolve(e.data)
      }
    }
    ws.addEventListener("message", handler as EventListener)
    setTimeout(() => {
      ws.removeEventListener("message", handler as EventListener)
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
    // Drain the "connected" message
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
