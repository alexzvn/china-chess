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
