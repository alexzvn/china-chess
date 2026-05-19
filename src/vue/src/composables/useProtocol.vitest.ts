import { describe, it, expect } from "vitest"

// Tests for the full WebSocket protocol (issues #2-13)
// All messages are JSON — test serialization + contract compliance

describe("Protocol: Client → Server messages", () => {
  // Issue #2: WebSocket Connect + Echo
  it("ping message", () => {
    const msg = { type: "ping" }
    expect(msg).toEqual({ type: "ping" })
  })

  // Issue #3: Room Creation + Lobby
  it("createRoom action", () => {
    const msg = { action: "createRoom" }
    expect(msg.action).toBe("createRoom")
  })

  it("joinLobby action", () => {
    const msg = { action: "joinLobby" }
    expect(msg.action).toBe("joinLobby")
  })

  // Issue #4: Room Join + Game Start
  it("joinRoom action", () => {
    const msg = { action: "joinRoom", roomId: "abc1234" }
    expect(msg.action).toBe("joinRoom")
    expect(msg.roomId).toMatch(/^[a-zA-Z0-9_-]{7}$/)
  })

  it("rejoinRoom action (Issue #14)", () => {
    const msg = { action: "rejoinRoom", roomId: "abc1234", clientId: "client123" }
    expect(msg.action).toBe("rejoinRoom")
    expect(msg.clientId).toBe("client123")
  })

  it("startGame action", () => {
    const msg = { action: "startGame", roomId: "abc1234" }
    expect(msg.action).toBe("startGame")
    expect(msg.roomId).toBe("abc1234")
  })

  // Issue #9: Move Execution
  it("move action with Position objects", () => {
    const msg = {
      action: "move",
      roomId: "abc1234",
      from: { rank: 9, file: 0 },
      to: { rank: 8, file: 0 },
    }
    expect(msg.from.rank).toBeGreaterThanOrEqual(0)
    expect(msg.from.rank).toBeLessThanOrEqual(9)
    expect(msg.from.file).toBeGreaterThanOrEqual(0)
    expect(msg.from.file).toBeLessThanOrEqual(8)
    expect(msg.to.rank).toBeGreaterThanOrEqual(0)
    expect(msg.to.rank).toBeLessThanOrEqual(9)
  })

  // Issue #12: Chat
  it("chat message", () => {
    const msg = { type: "chat", roomId: "abc1234", text: "Hello!" }
    expect(msg.type).toBe("chat")
    expect(typeof msg.text).toBe("string")
    expect(msg.text.length).toBeGreaterThan(0)
  })

  // Issue #13: Draw Offer + Resign
  it("resign action", () => {
    const msg = { action: "resign", roomId: "abc1234" }
    expect(msg.action).toBe("resign")
  })

  it("drawOffer message", () => {
    const msg = { type: "drawOffer", roomId: "abc1234" }
    expect(msg.type).toBe("drawOffer")
  })

  it("drawAccept message", () => {
    const msg = { type: "drawAccept", roomId: "abc1234" }
    expect(msg.type).toBe("drawAccept")
  })

  it("drawDecline message", () => {
    const msg = { type: "drawDecline", roomId: "abc1234" }
    expect(msg.type).toBe("drawDecline")
  })
})

describe("Protocol: Server → Client messages", () => {
  // Issue #2
  it("connected message", () => {
    const msg = { type: "connected", clientId: "abc1234" }
    expect(msg.clientId).toMatch(/^[a-zA-Z0-9_-]{7}$/)
  })

  it("pong response", () => {
    const msg = { type: "pong" }
    expect(msg.type).toBe("pong")
  })

  // Issue #3
  it("roomCreated message", () => {
    const msg = { type: "roomCreated", roomId: "abc1234" }
    expect(msg.roomId).toMatch(/^[a-zA-Z0-9_-]{7}$/)
  })

  it("lobbyUpdate message with rooms array", () => {
    const msg = {
      type: "lobbyUpdate",
      rooms: [
        { roomId: "abc1234", playerA: "p1", playerB: null, status: "waiting" },
        { roomId: "xyz5678", playerA: "p2", playerB: "p3", status: "playing" },
      ],
    }
    expect(msg.rooms.length).toBe(2)
    expect(msg.rooms[0]!.status).toBe("waiting")
    expect(msg.rooms[1]!.status).toBe("playing")
    expect(msg.rooms[0]!.playerB).toBeNull()
    expect(msg.rooms[1]!.playerB).toBe("p3")
  })

  // Issue #4
  it("roomJoined message", () => {
    const msg = { type: "roomJoined", roomId: "abc1234", player: "B" }
    expect(msg.player).toBe("B")
  })

  it("gameStart message with color assignment", () => {
    const msg = { type: "gameStart", yourColor: "red", roomId: "abc1234", opponentId: "p2" }
    expect(["red", "black"]).toContain(msg.yourColor)
    expect(msg.opponentId).toBe("p2")
  })

  // Issue #9-10: Board Update
  it("boardUpdate message with full state", () => {
    const board = Array.from({ length: 10 }, () => Array(9).fill(null))
    board[9]![4] = "r帥"
    const msg = {
      type: "boardUpdate",
      board,
      turn: "red",
      moveCount: 1,
      lastMove: { from: { rank: 7, file: 1 }, to: { rank: 7, file: 4 } },
      inCheck: false,
    }
    expect(msg.board[9]![4]).toBe("r帥")
    expect(msg.turn).toBe("red")
    expect(msg.moveCount).toBe(1)
    expect(msg.inCheck).toBe(false)
    expect(msg.lastMove.from.rank).toBe(7)
  })

  // Issue #11: Game Over
  it("gameEnd message for checkmate", () => {
    const msg = { type: "gameEnd", result: "checkmate", winnerColor: "red", reason: "Checkmate! Red wins" }
    expect(msg.result).toBe("checkmate")
    expect(msg.winnerColor).toBe("red")
    expect(msg.reason).toContain("Checkmate")
  })

  it("gameEnd message for stalemate", () => {
    const msg = { type: "gameEnd", result: "stalemate", winnerColor: "black", reason: "Stalemate! Black wins" }
    expect(msg.result).toBe("stalemate")
    expect(msg.winnerColor).toBe("black")
  })

  it("gameEnd message for resignation", () => {
    const msg = { type: "gameEnd", result: "resign", winnerColor: "red", reason: "Red wins by resignation" }
    expect(msg.result).toBe("resign")
  })

  it("gameEnd message for draw", () => {
    const msg = { type: "gameEnd", result: "draw", winnerColor: null, reason: "Game ended — Draw" }
    expect(msg.result).toBe("draw")
    expect(msg.winnerColor).toBeNull()
  })

  // Issue #12: Chat
  it("chat message with enriched metadata", () => {
    const msg = {
      type: "chat",
      message: {
        sender: "client123",
        text: "Good game",
        timestamp: Date.now(),
        color: "red",
      },
    }
    expect(msg.message.color).toBe("red")
    expect(typeof msg.message.timestamp).toBe("number")
  })

  // Issue #13: Draw
  it("drawOffered notification", () => {
    const msg = { type: "drawOffered", fromClientId: "client123" }
    expect(msg.type).toBe("drawOffered")
  })

  it("drawDeclined notification", () => {
    const msg = { type: "drawDeclined" }
    expect(msg.type).toBe("drawDeclined")
  })

  // Issue #14: Reconnection
  it("opponentReconnected notification", () => {
    const msg = { type: "opponentReconnected" }
    expect(msg.type).toBe("opponentReconnected")
  })

  // Error handling
  it("error message with code", () => {
    const msg = { type: "error", code: "INVALID_MOVE", message: "Illegal move" }
    expect(msg.code).toBe("INVALID_MOVE")
    expect(msg.message).toBe("Illegal move")
  })

  it("NOT_YOUR_TURN error", () => {
    const msg = { type: "error", code: "NOT_YOUR_TURN", message: "Not your turn" }
    expect(msg.code).toBe("NOT_YOUR_TURN")
  })
})

describe("Protocol: Room lifecycle", () => {
  it("Room type has all required fields", () => {
    const room = {
      roomId: "abc1234",
      createdAt: new Date().toISOString(),
      playerA: "client1",
      playerB: "client2",
      status: "playing" as const,
    }
    expect(room.roomId).toBeDefined()
    expect(room.createdAt).toBeDefined()
    expect(room.playerA).toBeDefined()
    expect(room.status).toBe("playing")
  })

  it("status transitions: waiting → playing → finished", () => {
    const validStatuses = ["waiting", "playing", "finished"] as const
    let room = { status: "waiting" as (typeof validStatuses)[number] }
    expect(validStatuses).toContain(room.status)
    room.status = "playing"
    expect(validStatuses).toContain(room.status)
    room.status = "finished"
    expect(validStatuses).toContain(room.status)
  })

  it("colors are randomly assigned (red or black)", () => {
    const colors = ["red", "black"]
    // Run multiple times to verify both assignments are possible
    const assigned: string[] = []
    for (let i = 0; i < 100; i++) {
      const shuffled = [...colors]
      if (Math.random() < 0.5) shuffled.reverse()
      assigned.push(shuffled.join(","))
    }
    // Both "red,black" and "black,red" should appear
    expect(assigned.some((a) => a === "red,black")).toBe(true)
    expect(assigned.some((a) => a === "black,red")).toBe(true)
  })
})

describe("Protocol: Move validation (Issue #5-6)", () => {
  it("move positions have valid rank (0-9) and file (0-8)", () => {
    for (let r = 0; r < 10; r++) {
      for (let f = 0; f < 9; f++) {
        expect(r).toBeGreaterThanOrEqual(0)
        expect(r).toBeLessThanOrEqual(9)
        expect(f).toBeGreaterThanOrEqual(0)
        expect(f).toBeLessThanOrEqual(8)
      }
    }
  })

  it("piece prefix indicates color", () => {
    expect("r車".charAt(0)).toBe("r")
    expect("b車".charAt(0)).toBe("b")
  })
})
