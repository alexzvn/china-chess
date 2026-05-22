import { describe, it, expect, beforeEach } from "bun:test"
import { handleLeaveRoom } from "./room"
import type { RoomActionContext, ActionResult } from "./types"
import type { Room } from "../rooms"
import type { GameState } from "../game/engine"
import { createInitialBoard } from "../game/board"

describe("handleLeaveRoom — forfeit", () => {
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
      gameState: {
        board: createInitialBoard(),
        turn: "red",
        moveCount: 0,
      } as GameState,
      rematchAcceptedA: false,
      rematchAcceptedB: false,
      spectators: [],
      timeA: 600,
      timeB: 600,
      ...overrides,
    }
  }

  function makeContext(room: Room, clientId: string): RoomActionContext {
    return {
      roomId: room.roomId,
      clientId,
      room,
      send: () => {},
      broadcastLobby: () => {},
    }
  }

  function findGameEnd(notifications: ActionResult["notifications"]) {
    return notifications.find(
      (n) => n.kind === "send" && (n.message as { type: string }).type === "gameEnd"
    ) as { kind: "send"; message: { type: "gameEnd"; result: string; winnerColor: string | null } } | undefined
  }

  it("sends gameEnd when player leaves during active game", () => {
    const room = makeRoom()
    const { rooms } = require("../rooms") as { rooms: Map<string, Room> }
    rooms.set(room.roomId, room)

    const ctx = makeContext(room, playerA)
    const result: ActionResult = handleLeaveRoom(ctx)

    expect(result.kind).toBe("ok")
    if (result.kind !== "ok") return

    const gameEnd = findGameEnd(result.notifications)
    expect(gameEnd).toBeDefined()
    expect(gameEnd!.message.result).toBe("resign")
    expect(gameEnd!.message.winnerColor).toBe("black") // playerA (red) forfeits, black wins
  })

  it("does NOT send gameEnd when leaving during waiting", () => {
    const room = makeRoom({ status: "waiting", gameState: undefined, colors: undefined })
    const { rooms } = require("../rooms") as { rooms: Map<string, Room> }
    rooms.set(room.roomId, room)

    const ctx = makeContext(room, playerA)
    const result: ActionResult = handleLeaveRoom(ctx)

    expect(result.kind).toBe("ok")
    if (result.kind !== "ok") return

    const gameEnd = findGameEnd(result.notifications)
    expect(gameEnd).toBeUndefined()
  })

  it("sends gameEnd when playerB forfeits during active game", () => {
    const room = makeRoom()
    const { rooms } = require("../rooms") as { rooms: Map<string, Room> }
    rooms.set(room.roomId, room)

    const ctx = makeContext(room, playerB)
    const result: ActionResult = handleLeaveRoom(ctx)

    expect(result.kind).toBe("ok")
    if (result.kind !== "ok") return

    const gameEnd = findGameEnd(result.notifications)
    expect(gameEnd).toBeDefined()
    expect(gameEnd!.message.result).toBe("resign")
    expect(gameEnd!.message.winnerColor).toBe("red") // playerB (black) forfeits, red wins
  })
})
