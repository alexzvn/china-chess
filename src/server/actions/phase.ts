import { rematch } from "../rooms"
import { getClientName } from "../clientNames"
import type { ServerMessage } from "../protocol"
import type { RoomActionContext, ActionResult, Notification } from "./types"

export function handleRematch(ctx: RoomActionContext): ActionResult {
  const result = rematch(ctx.roomId, ctx.clientId)

  const statePayload: ServerMessage = { type: "rematchState", acceptedA: result.room.rematchAcceptedA, acceptedB: result.room.rematchAcceptedB }

  const notifications: Notification[] = [
    { kind: "send" as const, clientId: result.room.playerA, message: statePayload },
    ...(result.room.playerB ? [{ kind: "send" as const, clientId: result.room.playerB, message: statePayload }] : []),
  ]

  if (result.bothAccepted) {
    const players: { clientId: string; ready: boolean; name: string }[] = [
      { clientId: result.room.playerA, ready: false, name: getClientName(result.room.playerA) },
      ...(result.room.playerB ? [{ clientId: result.room.playerB, ready: false, name: getClientName(result.room.playerB) }] : []),
    ]
    notifications.push(
      { kind: "send" as const, clientId: result.room.playerA, message: { type: "roomUpdate" as const, players, roomStatus: "waiting" as const } },
      ...(result.room.playerB ? [{ kind: "send" as const, clientId: result.room.playerB, message: { type: "roomUpdate" as const, players, roomStatus: "waiting" as const } }] : []),
    )
  }

  return { kind: "ok" as const, notifications }
}

export function handleRejoinRoom(ctx: RoomActionContext): ActionResult {
  if (!ctx.room.gameState) {
    return { kind: "error", message: "No active game in this room" }
  }

  const isPlayerA = ctx.room.playerA === ctx.clientId
  const color = isPlayerA ? ctx.room.colors!.a : ctx.room.colors!.b
  const opponentId = isPlayerA ? ctx.room.playerB! : ctx.room.playerA

  const notifications: Notification[] = [
    { kind: "send" as const, clientId: ctx.clientId, message: { type: "gameStart" as const, yourColor: color, roomId: ctx.roomId, opponentId } },
    { kind: "send" as const, clientId: ctx.clientId, message: { type: "boardUpdate" as const, board: ctx.room.gameState.board, turn: ctx.room.gameState.turn, moveCount: ctx.room.gameState.moveCount, lastMove: ctx.room.gameState.lastMove, inCheck: false } },
    { kind: "send" as const, clientId: opponentId, message: { type: "opponentReconnected" as const } },
  ]

  return { kind: "ok" as const, notifications }
}

export const phaseActions = {
  rematch: handleRematch,
  rejoinRoom: handleRejoinRoom,
}
