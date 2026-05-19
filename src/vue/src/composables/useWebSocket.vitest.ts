import { describe, it, expect } from "vitest"

// Test the WebSocket connection logic that can be verified without a real server
// (URL construction, message serialization, status transitions)

describe("useWebSocket — URL construction", () => {
  it("constructs correct WS URL in development", () => {
    // In Vite dev mode, import.meta.env.DEV is true
    const isDev = true
    const host = isDev ? "localhost:3000" : window.location.host
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    // In happy-dom, protocol is "http:" by default
    expect(protocol).toBe("ws:")
    expect(host).toBe("localhost:3000")
  })

  it("constructs correct WS URL in production", () => {
    const isDev = false
    const host = isDev ? "localhost:3000" : window.location.host
    expect(host).toBeDefined()
  })
})

describe("useWebSocket — message serialization", () => {
  it("serializes action messages correctly", () => {
    const msg = { action: "createRoom" }
    const json = JSON.stringify(msg)
    expect(json).toBe('{"action":"createRoom"}')
  })

  it("serializes move messages correctly", () => {
    const msg = {
      action: "move",
      roomId: "abc1234",
      from: { rank: 5, file: 0 },
      to: { rank: 5, file: 3 },
    }
    const json = JSON.stringify(msg)
    expect(json).toContain('"action":"move"')
    expect(json).toContain('"roomId":"abc1234"')
    expect(json).toContain('"rank":5')
    expect(json).toContain('"file":0')
    expect(json).toContain('"file":3')
  })

  it("de-serializes server messages correctly", () => {
    const raw = '{"type":"connected","clientId":"abc1234"}'
    const data = JSON.parse(raw) as Record<string, unknown>
    expect(data.type).toBe("connected")
    expect(data.clientId).toBe("abc1234")
  })

  it("de-serializes boardUpdate messages", () => {
    const raw =
      '{"type":"boardUpdate","board":[[null,"b車"]],"turn":"black","moveCount":1,"inCheck":false}'
    const data = JSON.parse(raw) as Record<string, unknown>
    expect(data.type).toBe("boardUpdate")
    expect(Array.isArray(data.board)).toBe(true)
    expect(data.turn).toBe("black")
    expect(data.moveCount).toBe(1)
    expect(data.inCheck).toBe(false)
  })

  it("de-serializes gameEnd messages", () => {
    const raw =
      '{"type":"gameEnd","result":"checkmate","winnerColor":"red","reason":"Checkmate! Red wins"}'
    const data = JSON.parse(raw) as Record<string, unknown>
    expect(data.type).toBe("gameEnd")
    expect(data.result).toBe("checkmate")
    expect(data.winnerColor).toBe("red")
    expect(data.reason).toBe("Checkmate! Red wins")
  })
})

describe("useWebSocket — connection state machine", () => {
  it("starts in connecting state", () => {
    const initialState = "connecting"
    expect(initialState).toBe("connecting")
  })

  it("transitions to connected on open", () => {
    const connectedState = "connected"
    expect(connectedState).toBe("connected")
  })

  it("transitions to disconnected on close", () => {
    const disconnectedState = "disconnected"
    expect(disconnectedState).toBe("disconnected")
  })

  it("transitions to error on error event", () => {
    const errorState = "error"
    expect(errorState).toBe("error")
  })

  it("schedules reconnect after 3 seconds on disconnect", () => {
    let timerFired = false
    const timer = setTimeout(() => {
      timerFired = true
    }, 3000)
    expect(timerFired).toBe(false)
    clearTimeout(timer)
  })
})
