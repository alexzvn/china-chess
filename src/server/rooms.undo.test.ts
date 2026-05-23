import { describe, it, expect, beforeEach } from "bun:test"
import { createRoom, getRoom, joinRoom, toggleReady, startGame, requestUndo, acceptUndo, declineUndo, isUndoExpired, clearExpiredUndo } from "./rooms"
import type { Room } from "./rooms"
import { createInitialBoard } from "./game/board"
import { makeMove } from "./game/engine"

describe("Undo — Room model", () => {
  let room: Room

  beforeEach(() => {
    const { rooms } = require("./rooms") as { rooms: Map<string, Room> }
    rooms.clear()
    room = createRoom("host-1")
    joinRoom(room.roomId, "player-b")
    toggleReady(room.roomId, "host-1")
    toggleReady(room.roomId, "player-b")
  })

  function makeMoveOnBoard(from: { rank: number; file: number }, to: { rank: number; file: number }) {
    const r = getRoom(room.roomId)!
    const result = makeMove(r.gameState!, from, to)
    if (result) {
      r.gameState = result
      // Track move history
      if (!r.moveHistory) r.moveHistory = []
      r.moveHistory.push({ from, to, captured: result.captured ?? null })
    }
    return result
  }

  it("requestUndo sets undoRequest", () => {
    makeMoveOnBoard({ rank: 7, file: 1 }, { rank: 4, file: 1 })
    const result = requestUndo(room.roomId, "player-b")
    expect(result.undoRequest).toBeDefined()
    expect(result.undoRequest!.from).toBe("player-b")
    expect(result.undoRequest!.expiresAt).toBeGreaterThan(Date.now())
  })

  it("requestUndo throws if no moves made", () => {
    expect(() => requestUndo(room.roomId, "host-1")).toThrow("No moves to undo")
  })

  it("requestUndo throws if game not active", () => {
    const r = getRoom(room.roomId)!
    r.status = "waiting"
    expect(() => requestUndo(room.roomId, "host-1")).toThrow("Game not active")
  })

  it("acceptUndo reverts board to previous state", () => {
    makeMoveOnBoard({ rank: 7, file: 1 }, { rank: 4, file: 1 })
    const beforeUndo = getRoom(room.roomId)!
    const boardBefore = beforeUndo.gameState!.board.map(row => [...row])
    const moveCountBefore = beforeUndo.gameState!.moveCount
    const turnBefore = beforeUndo.gameState!.turn

    requestUndo(room.roomId, "host-1")
    const result = acceptUndo(room.roomId)

    expect(result.undone).toBe(true)
    expect(result.room.gameState!.moveCount).toBe(moveCountBefore - 1)
    expect(result.room.gameState!.turn).not.toBe(turnBefore)
    // Cannon should be back at original position
    expect(result.room.gameState!.board[7]![1]).toBe("r炮")
  })

  it("declineUndo clears undoRequest", () => {
    makeMoveOnBoard({ rank: 7, file: 1 }, { rank: 4, file: 1 })
    requestUndo(room.roomId, "host-1")
    const result = declineUndo(room.roomId)
    expect(result.undoRequest).toBeNull()
  })

  it("isUndoExpired detects expired requests", () => {
    makeMoveOnBoard({ rank: 7, file: 1 }, { rank: 4, file: 1 })
    const r = getRoom(room.roomId)!
    // Set request with expired time
    r.undoRequest = { from: "host-1", expiresAt: Date.now() - 1000 }
    expect(isUndoExpired(room.roomId)).toBe(true)
  })

  it("clearExpiredUndo nullifies expired requests", () => {
    makeMoveOnBoard({ rank: 7, file: 1 }, { rank: 4, file: 1 })
    const r = getRoom(room.roomId)!
    r.undoRequest = { from: "host-1", expiresAt: Date.now() - 1000 }
    const cleared = clearExpiredUndo(room.roomId)
    expect(cleared).not.toBeNull()
    expect(r.undoRequest).toBeNull()
  })
})
