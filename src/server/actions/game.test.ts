import { describe, it, expect, beforeEach } from "bun:test"
import { handleMove } from "./game"
import { getPositionKey } from "../game/rules"
import type { RoomActionContext, ActionResult, Notification } from "./types"
import type { Room } from "../rooms"
import type { GameState, Board } from "../game/engine"

function emptyBoard(): Board {
  return Array.from({ length: 10 }, () => Array(9).fill(null))
}

describe("handleMove — extended rules integration", () => {
  const roomId = "test-room"
  const playerA = "player-a"
  const playerB = "player-b"

  beforeEach(() => {
    const { rooms } = require("../rooms") as { rooms: Map<string, Room> }
    rooms.clear()
  })

  function makeRoom(overrides: Partial<Room> = {}): Room {
    return {
      roomId,
      createdAt: "2025-01-01",
      playerA,
      playerB,
      playerAReady: true,
      playerBReady: true,
      status: "playing",
      colors: { a: "red", b: "black" },
      rematchAcceptedA: false,
      rematchAcceptedB: false,
      spectators: [],
      timeA: 600,
      timeB: 600,
      lastTimeUpdate: Date.now(),
      ...overrides,
    }
  }

  function makeContext(room: Room, clientId: string, from?: { rank: number; file: number }, to?: { rank: number; file: number }): RoomActionContext {
    return {
      roomId: room.roomId,
      clientId,
      room,
      from,
      to,
      send: () => {},
      broadcastLobby: () => {},
    }
  }

  function findGameEnd(notifications: Notification[]) {
    return notifications.find(
      (n) => n.kind === "send" && (n.message as { type: string }).type === "gameEnd"
    )
  }

  describe("Insufficient material", () => {
    it("ends game with draw when only kings remain on board", () => {
      const board = emptyBoard()
      board[9]![4] = "r帥"
      board[0]![3] = "b將"

      const gameState: GameState = {
        board,
        turn: "red",
        moveCount: 0,
      }

      const room = makeRoom({ gameState })
      const { rooms } = require("../rooms") as { rooms: Map<string, Room> }
      rooms.set(room.roomId, room)

      const ctx = makeContext(room, playerA, { rank: 9, file: 4 }, { rank: 8, file: 4 })
      const result: ActionResult = handleMove(ctx)

      expect(result.kind).toBe("ok")
      if (result.kind !== "ok") return

      const gameEnd = findGameEnd(result.notifications) as { kind: "send"; message: { type: string; result: string; winnerColor: string | null } } | undefined
      expect(gameEnd).toBeDefined()
      expect(gameEnd!.message.result).toBe("draw")
      expect(gameEnd!.message.winnerColor).toBeNull()
      expect(room.status).toBe("finished")
    })
  })

  describe("time controls", () => {
    it("deducts elapsed time from mover, opponent unchanged", () => {
      const board = emptyBoard()
      board[9]![4] = "r帥"
      board[0]![3] = "b將"
      board[6]![0] = "r兵"

      const gameState: GameState = { board, turn: "red", moveCount: 0 }

      const now = Date.now()
      // Simulate red spending 15 seconds thinking
      const room = makeRoom({
        gameState,
        timeA: 600,
        timeB: 600,
        lastTimeUpdate: now - 15000,
      })
      const { rooms } = require("../rooms") as { rooms: Map<string, Room> }
      rooms.set(room.roomId, room)

      // Red (playerA) moves pawn forward
      const ctx = makeContext(room, playerA, { rank: 6, file: 0 }, { rank: 5, file: 0 })
      const result: ActionResult = handleMove(ctx)

      expect(result.kind).toBe("ok")
      if (result.kind !== "ok") return

      // Find the timeUpdate notification
      const timeNotification = result.notifications.find(
        (n) => n.kind === "send" && (n.message as { type: string }).type === "timeUpdate"
      )
      expect(timeNotification).toBeDefined()
      if (!timeNotification || timeNotification.kind !== "send") return

      const timeMsg = timeNotification.message as { timeA: number; timeB: number; timeAColor: string }
      // Player A (red) spent 15s, loses 15s from clock
      expect(timeMsg.timeA).toBe(600 - 15)
      // Player B (black, opponent) unchanged
      expect(timeMsg.timeB).toBe(600)
    })

    it("leaves opponent time unchanged when playerB moves", () => {
      const board = emptyBoard()
      board[9]![4] = "r帥"
      board[0]![3] = "b將"
      board[3]![0] = "b卒"

      // Red just moved, now black's turn
      const gameState: GameState = { board, turn: "black", moveCount: 1 }

      const now = Date.now()
      const room = makeRoom({
        gameState,
        timeA: 595,  // playerA (red) lost time from previous turn
        timeB: 600,
        lastTimeUpdate: now - 5000,  // black spent 5s thinking
      })
      const { rooms } = require("../rooms") as { rooms: Map<string, Room> }
      rooms.set(room.roomId, room)

      // Black (playerB) moves pawn forward
      const ctx = makeContext(room, playerB, { rank: 3, file: 0 }, { rank: 4, file: 0 })
      const result: ActionResult = handleMove(ctx)

      expect(result.kind).toBe("ok")
      if (result.kind !== "ok") return

      const timeNotification = result.notifications.find(
        (n) => n.kind === "send" && (n.message as { type: string }).type === "timeUpdate"
      )
      expect(timeNotification).toBeDefined()
      if (!timeNotification || timeNotification.kind !== "send") return

      const timeMsg = timeNotification.message as { timeA: number; timeB: number; timeAColor: string }
      // Player B (black) spent 5s, loses 5s from clock
      expect(timeMsg.timeB).toBe(600 - 5)
      // Player A (red) unchanged
      expect(timeMsg.timeA).toBe(595)
    })
  })

  describe("Perpetual chase", () => {
    it("ends game with draw when same position repeats 3 times", () => {
      const board = emptyBoard()
      board[9]![4] = "r帥"
      board[0]![3] = "b將"
      board[5]![1] = "r車"
      board[5]![8] = "b車"

      // Board state S₁: 車 at [5,0]
      const boardS1 = emptyBoard()
      boardS1[9]![4] = "r帥"
      boardS1[0]![3] = "b將"
      boardS1[5]![0] = "r車"
      boardS1[5]![8] = "b車"
      const keyS1 = getPositionKey(boardS1)

      // Board state S₂: 車 at [5,1] (matches current board)
      const boardS2 = emptyBoard()
      boardS2[9]![4] = "r帥"
      boardS2[0]![3] = "b將"
      boardS2[5]![1] = "r車"
      boardS2[5]![8] = "b車"
      const keyS2 = getPositionKey(boardS2)

      const gameState: GameState = {
        board,
        turn: "red",
        moveCount: 4,
        // S₁ appears 2 times, S₂ appears 2 times
        positionHistory: [keyS1, keyS2, keyS1, keyS2],
      }

      const room = makeRoom({ gameState })
      const { rooms } = require("../rooms") as { rooms: Map<string, Room> }
      rooms.set(room.roomId, room)

      // Red moves 車 from [5,1] back to [5,0] → board becomes S₁
      // History becomes [S₁, S₂, S₁, S₂, S₁] → S₁ appears 3 times → draw
      const ctx = makeContext(room, playerA, { rank: 5, file: 1 }, { rank: 5, file: 0 })
      const result: ActionResult = handleMove(ctx)

      expect(result.kind).toBe("ok")
      if (result.kind !== "ok") return

      const gameEnd = findGameEnd(result.notifications) as { kind: "send"; message: { type: string; result: string; winnerColor: string | null } } | undefined
      expect(gameEnd).toBeDefined()
      expect(gameEnd!.message.result).toBe("draw")
      expect(gameEnd!.message.winnerColor).toBeNull()
      expect(room.status).toBe("finished")
    })
  })
})
