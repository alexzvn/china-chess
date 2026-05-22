import { describe, it, expect } from "bun:test"
import { handleRejoinRoom } from "./phase"
import type { RoomActionContext, ActionResult } from "./types"
import type { Room } from "../rooms"
import type { GameState } from "../game/engine"
import { createInitialBoard } from "../game/board"

describe("handleRejoinRoom", () => {
  function makeRoom(gameState?: GameState): Room {
    return {
      roomId: "test-room",
      createdAt: "2025-01-01",
      playerA: "player-a",
      playerB: "player-b",
      playerAReady: false,
      playerBReady: false,
      status: gameState ? "playing" : "waiting",
      gameState,
      colors: gameState ? { a: "red", b: "black" } : undefined,
      rematchAcceptedA: false,
      rematchAcceptedB: false,
      spectators: [],
    }
  }

  function makeContext(room: Room, clientId = "player-a"): RoomActionContext {
    return {
      roomId: room.roomId,
      clientId,
      room,
      send: () => {},
      broadcastLobby: () => {},
    }
  }

  it("includes lastMove in boardUpdate when gameState has lastMove", () => {
    const gameState: GameState = {
      board: createInitialBoard(),
      turn: "red",
      moveCount: 1,
      lastMove: { from: { rank: 7, file: 1 }, to: { rank: 7, file: 4 } },
    }
    const room = makeRoom(gameState)
    const ctx = makeContext(room)

    const result: ActionResult = handleRejoinRoom(ctx)
    expect(result.kind).toBe("ok")
    if (result.kind !== "ok") return

    const boardUpdate = result.notifications.find(
      (n) => n.kind === "send" && n.message.type === "boardUpdate",
    )
    expect(boardUpdate).toBeDefined()
    if (boardUpdate?.kind === "send" && boardUpdate.message.type === "boardUpdate") {
      expect(boardUpdate.message.lastMove).toEqual({ from: { rank: 7, file: 1 }, to: { rank: 7, file: 4 } })
    }
  })

  it("omits lastMove in boardUpdate when no moves have been made", () => {
    const gameState: GameState = {
      board: createInitialBoard(),
      turn: "red",
      moveCount: 0,
    }
    const room = makeRoom(gameState)
    const ctx = makeContext(room)

    const result: ActionResult = handleRejoinRoom(ctx)
    expect(result.kind).toBe("ok")
    if (result.kind !== "ok") return

    const boardUpdate = result.notifications.find(
      (n) => n.kind === "send" && n.message.type === "boardUpdate",
    )
    expect(boardUpdate).toBeDefined()
    if (boardUpdate?.kind === "send" && boardUpdate.message.type === "boardUpdate") {
      expect(boardUpdate.message.lastMove).toBeUndefined()
    }
  })

  it("returns error when room has no active game", () => {
    const room = makeRoom(undefined) // no gameState → status: "waiting"
    const ctx = makeContext(room)

    const result: ActionResult = handleRejoinRoom(ctx)
    expect(result.kind).toBe("error")
  })
})
