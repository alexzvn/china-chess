import { toggleReady, resign, applyTimeControl, getTimeUpdate, isTimeOut, timeControlSettings } from "../rooms"
import { getClientName } from "../clientNames"
import { makeMove, isInCheck, isCheckmate, isStalemate } from "../game/engine"
import type { ServerMessage } from "../protocol"
import type { RoomActionContext, ActionResult, Notification } from "./types"

export function handleToggleReady(ctx: RoomActionContext): ActionResult {
  toggleReady(ctx.roomId, ctx.clientId)

  const players: { clientId: string; ready: boolean; name: string }[] = [
    { clientId: ctx.room.playerA, ready: ctx.room.playerAReady, name: getClientName(ctx.room.playerA) },
  ]
  if (ctx.room.playerB) {
    players.push({ clientId: ctx.room.playerB, ready: ctx.room.playerBReady, name: getClientName(ctx.room.playerB) })
  }

  if (ctx.room.status === "playing") {
    // Get initial times
    const timeA = ctx.room.timeA ?? timeControlSettings.initial
    const timeB = ctx.room.timeB ?? timeControlSettings.initial
    
    const notifications: Notification[] = [
      { kind: "send" as const, clientId: ctx.room.playerA, message: { type: "roomUpdate" as const, players, roomStatus: "waiting" as const } },
      { kind: "send" as const, clientId: ctx.room.playerB!, message: { type: "roomUpdate" as const, players, roomStatus: "waiting" as const } },
      { kind: "send" as const, clientId: ctx.room.playerA, message: { type: "gameStart" as const, yourColor: ctx.room.colors!.a, roomId: ctx.roomId, opponentId: ctx.room.playerB! } },
      { kind: "send" as const, clientId: ctx.room.playerB!, message: { type: "gameStart" as const, yourColor: ctx.room.colors!.b, roomId: ctx.roomId, opponentId: ctx.room.playerA } },
      // Send initial time to both players
      { kind: "send" as const, clientId: ctx.room.playerA, message: { type: "timeUpdate" as const, timeA, timeB } },
      { kind: "send" as const, clientId: ctx.room.playerB!, message: { type: "timeUpdate" as const, timeA, timeB } },
      { kind: "broadcastLobby" as const },
    ]
    return { kind: "ok" as const, notifications }
  }

  const notifications: Notification[] = [
    { kind: "send" as const, clientId: ctx.room.playerA, message: { type: "roomUpdate" as const, players, roomStatus: ctx.room.status } },
    ...(ctx.room.playerB ? [{ kind: "send" as const, clientId: ctx.room.playerB, message: { type: "roomUpdate" as const, players, roomStatus: ctx.room.status } }] : []),
  ]
  return { kind: "ok" as const, notifications }
}

export function handleMove(ctx: RoomActionContext): ActionResult {
  if (!ctx.room.gameState) {
    return { kind: "error", message: "Game not active" }
  }
  if (ctx.room.status !== "playing") {
    return { kind: "error", message: "Game not active" }
  }
  if (!ctx.from || !ctx.to) {
    return { kind: "error", message: "Missing move coordinates" }
  }
  if (ctx.room.playerA !== ctx.clientId && ctx.room.playerB !== ctx.clientId) {
    return { kind: "error", message: "Not your game" }
  }
  if (ctx.room.gameState.turn !== (ctx.room.playerA === ctx.clientId ? ctx.room.colors!.a : ctx.room.colors!.b)) {
    return { kind: "error", message: "Not your turn" }
  }

  const result = makeMove(ctx.room.gameState, ctx.from, ctx.to)
  if (!result) {
    return { kind: "error", message: "Illegal move" }
  }

  ctx.room.gameState = result

  // Apply time control: opponent loses time after each move
  const moverColor = ctx.room.playerA === ctx.clientId ? ctx.room.colors!.a : ctx.room.colors!.b
  const opponentColor = moverColor === "red" ? "black" : "red"
  applyTimeControl(ctx.roomId, opponentColor)

  // Check for timeout
  const timeOut = isTimeOut(ctx.roomId, opponentColor)

  const inCheck = isInCheck(result.board, result.turn)
  const notifications: Notification[] = [
    { kind: "send" as const, clientId: ctx.room.playerA, message: { type: "boardUpdate" as const, board: result.board, turn: result.turn, moveCount: result.moveCount, lastMove: { from: ctx.from, to: ctx.to }, inCheck } },
    { kind: "send" as const, clientId: ctx.room.playerB!, message: { type: "boardUpdate" as const, board: result.board, turn: result.turn, moveCount: result.moveCount, lastMove: { from: ctx.from, to: ctx.to }, inCheck } },
  ]

  // Send time update to both players and spectators
  const timeUpdate = getTimeUpdate(ctx.roomId)
  if (timeUpdate) {
    const timeMsg: ServerMessage = { type: "timeUpdate", timeA: timeUpdate.timeA, timeB: timeUpdate.timeB }
    notifications.push(
      { kind: "send" as const, clientId: ctx.room.playerA, message: timeMsg },
      { kind: "send" as const, clientId: ctx.room.playerB!, message: timeMsg },
      ...ctx.room.spectators.map(s => ({ kind: "send" as const, clientId: s, message: timeMsg })),
    )
  }

  // Check for win conditions
  const winner = isCheckmate(result.board, result.turn)
    ? { result: "checkmate" as const, winnerColor: result.turn === "red" ? "black" : "red" as const }
    : isStalemate(result.board, result.turn)
      ? { result: "stalemate" as const, winnerColor: result.turn === "red" ? "black" : "red" as const }
      : timeOut
        ? { result: "timeout" as const, winnerColor: moverColor as "red" | "black" }
        : null

  if (winner) {
    ctx.room.status = "finished"
    const expiresAt = Date.now() + 30000
    const wc = winner.winnerColor as "red" | "black"
    const reason = winner.result === "timeout" 
      ? `${wc === "red" ? "Red" : "Black"} wins on time`
      : `${wc === "red" ? "Red" : "Black"} wins by ${winner.result}`
    const endMsg: ServerMessage = { type: "gameEnd", result: winner.result, winnerColor: wc, reason, expiresAt }
    notifications.push(
      { kind: "send" as const, clientId: ctx.room.playerA, message: endMsg },
      { kind: "send" as const, clientId: ctx.room.playerB!, message: endMsg },
      { kind: "broadcastLobby" as const },
    )
  }

  return { kind: "ok" as const, notifications }
}

export function handleResign(ctx: RoomActionContext): ActionResult {
  resign(ctx.roomId, ctx.clientId)

  const resignerColor = ctx.room.playerA === ctx.clientId ? ctx.room.colors!.a : ctx.room.colors!.b
  const winnerColor = resignerColor === "red" ? "black" : "red"
  const expiresAt = Date.now() + 30000

  const notifications: Notification[] = [
    { kind: "send" as const, clientId: ctx.room.playerA, message: { type: "gameEnd" as const, result: "resign" as const, winnerColor, reason: `${winnerColor === "red" ? "Red" : "Black"} wins by resignation`, expiresAt } },
    { kind: "send" as const, clientId: ctx.room.playerB!, message: { type: "gameEnd" as const, result: "resign" as const, winnerColor, reason: `${winnerColor === "red" ? "Red" : "Black"} wins by resignation`, expiresAt } },
    { kind: "broadcastLobby" as const },
  ]

  return { kind: "ok" as const, notifications }
}

export function handleDrawOffer(ctx: RoomActionContext): ActionResult {
  if (ctx.room.status !== "playing") {
    return { kind: "error", message: "Game not active" }
  }
  const opponentId = ctx.room.playerA === ctx.clientId ? ctx.room.playerB! : ctx.room.playerA
  const notifications: Notification[] = [
    { kind: "send" as const, clientId: opponentId, message: { type: "drawOffered" as const, fromClientId: ctx.clientId } },
  ]
  return { kind: "ok" as const, notifications }
}

export function handleDrawAccept(ctx: RoomActionContext): ActionResult {
  ctx.room.status = "finished"
  const expiresAt = Date.now() + 30000

  const notifications: Notification[] = [
    { kind: "send" as const, clientId: ctx.room.playerA, message: { type: "gameEnd" as const, result: "draw" as const, winnerColor: null, reason: "Game ended — Draw", expiresAt } },
    { kind: "send" as const, clientId: ctx.room.playerB!, message: { type: "gameEnd" as const, result: "draw" as const, winnerColor: null, reason: "Game ended — Draw", expiresAt } },
    { kind: "broadcastLobby" as const },
  ]

  return { kind: "ok" as const, notifications }
}

export function handleDrawDecline(ctx: RoomActionContext): ActionResult {
  const offererId = ctx.room.playerA === ctx.clientId ? ctx.room.playerB! : ctx.room.playerA
  const notifications: Notification[] = [
    { kind: "send" as const, clientId: offererId, message: { type: "drawDeclined" as const } },
  ]
  return { kind: "ok" as const, notifications }
}

export const gameActions = {
  toggleReady: handleToggleReady,
  move: handleMove,
  resign: handleResign,
  drawOffer: handleDrawOffer,
  drawAccept: handleDrawAccept,
  drawDecline: handleDrawDecline,
}
