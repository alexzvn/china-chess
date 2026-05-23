import { createRoom, getRoom, getLobbyRooms, joinRoom, kickPlayer, leaveRoom, joinAsSpectator, leaveSpectate, getSpectators, becomeSpectator, kickToSpectator, createBotRoom, rooms as allRooms } from "../rooms"
import { getClientName } from "../clientNames"
import type { RoomActionContext, NoRoomActionContext, ActionResult, Notification } from "./types"
import type { Difficulty } from "../game/bot"

export function handleCreateRoom(ctx: NoRoomActionContext): ActionResult {
  const room = createRoom(ctx.clientId)
  const notifications: Notification[] = [
    { kind: "send" as const, clientId: ctx.clientId, message: { type: "roomCreated" as const, roomId: room.roomId } },
    { kind: "send" as const, clientId: ctx.clientId, message: { type: "roomUpdate" as const, players: [{ clientId: room.playerA, ready: false, name: getClientName(room.playerA) }], roomStatus: "waiting" as const } },
    { kind: "broadcastLobby" as const },
  ]
  return { kind: "ok" as const, notifications }
}

export function handleJoinLobby(ctx: NoRoomActionContext): ActionResult {
  const lobbyList = [...getLobbyRooms(), ...Array.from(allRooms.values()).filter(r => r.status === "playing")]
  const roomData = lobbyList.map((r) => ({
    roomId: r.roomId,
    playerA: r.playerA,
    playerB: r.playerB,
    status: r.status,
    hostName: getClientName(r.playerA) || r.playerA.slice(0, 5),
    spectatorCount: r.spectators?.length || 0,
  }))
  return {
    kind: "ok",
    notifications: [
      { kind: "send", clientId: ctx.clientId, message: { type: "lobbyUpdate", rooms: roomData } },
    ],
  }
}

export function handleJoinRoom(ctx: RoomActionContext): ActionResult {
  try {
    joinRoom(ctx.roomId, ctx.clientId)
  } catch (e) {
    return { kind: "error", message: (e as Error).message }
  }

  const room = ctx.room
  const players: { clientId: string; ready: boolean; name: string }[] = [
    { clientId: room.playerA, ready: room.playerAReady, name: getClientName(room.playerA) },
  ]
  if (room.playerB) {
    players.push({ clientId: room.playerB, ready: room.playerBReady, name: getClientName(room.playerB) })
  }

  const notifications: Notification[] = [
    { kind: "send" as const, clientId: room.playerA, message: { type: "roomUpdate" as const, players, roomStatus: room.status } },
  ]
  if (room.playerB) {
    notifications.push({ kind: "send" as const, clientId: room.playerB, message: { type: "roomUpdate" as const, players, roomStatus: room.status } })
  }
  notifications.push({ kind: "broadcastLobby" as const })

  return { kind: "ok" as const, notifications }
}

export function handleKickPlayer(ctx: RoomActionContext): ActionResult {
  const { room, kickedId } = kickPlayer(ctx.roomId, ctx.clientId)

  const notifications: Notification[] = [
    { kind: "send" as const, clientId: kickedId, message: { type: "kicked" as const, reason: "You were kicked by the host" } },
    { kind: "send" as const, clientId: room.playerA, message: { type: "roomUpdate" as const, players: [{ clientId: room.playerA, ready: false, name: getClientName(room.playerA) }], roomStatus: "waiting" as const } },
    { kind: "broadcastLobby" as const },
  ]
  return { kind: "ok" as const, notifications }
}

export function handleLeaveRoom(ctx: RoomActionContext): ActionResult {
  const room = ctx.room
  const isHost = room.playerA === ctx.clientId
  const isPlaying = room.status === "playing"
  const opponentId = isHost ? room.playerB : room.playerA

  // If leaving during active game, it's a forfeit — send gameEnd first
  let forfeitNotifications: Notification[] = []
  if (isPlaying && opponentId && room.colors) {
    const forfeiterColor = isHost ? room.colors.a : room.colors.b
    const winnerColor = forfeiterColor === "red" ? "black" : "red"
    const expiresAt = Date.now() + 30000
    const endMsg = { type: "gameEnd" as const, result: "resign" as const, winnerColor, reason: `${winnerColor === "red" ? "Red" : "Black"} wins by forfeit`, expiresAt }
    forfeitNotifications = [
      { kind: "send" as const, clientId: room.playerA, message: endMsg },
      ...(room.playerB ? [{ kind: "send" as const, clientId: room.playerB, message: endMsg }] : []),
    ]
  }

  leaveRoom(ctx.roomId, ctx.clientId)

  if (isHost) {
    // Host left — room was deleted, notify opponent
    if (opponentId) {
      const notifications: Notification[] = [
        ...forfeitNotifications,
        { kind: "send" as const, clientId: opponentId, message: { type: "error" as const, message: "Host left the room" } },
      ]
      return { kind: "ok" as const, notifications }
    }
    return { kind: "ok" as const, notifications: forfeitNotifications }
  }

  // playerB left — room reset to waiting
  const notifications: Notification[] = [
    ...forfeitNotifications,
    { kind: "send" as const, clientId: room.playerA, message: { type: "roomUpdate" as const, players: [{ clientId: room.playerA, ready: false, name: getClientName(room.playerA) }], roomStatus: "waiting" as const } },
    { kind: "broadcastLobby" as const },
  ]
  return { kind: "ok" as const, notifications }
}

export function handleJoinAsSpectator(ctx: RoomActionContext): ActionResult {
  try {
    joinAsSpectator(ctx.roomId, ctx.clientId)
  } catch (e) {
    return { kind: "error", message: (e as Error).message }
  }

  const room = ctx.room
  const players: { clientId: string; ready: boolean; name: string }[] = [
    { clientId: room.playerA, ready: room.playerAReady, name: getClientName(room.playerA) },
  ]
  if (room.playerB) {
    players.push({ clientId: room.playerB, ready: room.playerBReady, name: getClientName(room.playerB) })
  }

  const spectators = getSpectators(ctx.roomId)
  const payload = {
    type: "roomUpdate" as const,
    players,
    roomStatus: room.status,
    spectators,
  }

  const notifications: Notification[] = [
    { kind: "send" as const, clientId: room.playerA, message: payload },
    ...(room.playerB ? [{ kind: "send" as const, clientId: room.playerB, message: payload }] : []),
    { kind: "send" as const, clientId: ctx.clientId, message: { type: "roomUpdate" as const, players, roomStatus: room.status } },
  ]

  return { kind: "ok" as const, notifications }
}

export function handleLeaveSpectate(ctx: RoomActionContext): ActionResult {
  leaveSpectate(ctx.roomId, ctx.clientId)

  const room = ctx.room
  const spectators = getSpectators(ctx.roomId)
  const payload = {
    type: "spectatorUpdate" as const,
    spectators,
  }

  const notifications: Notification[] = [
    { kind: "send" as const, clientId: room.playerA, message: payload },
    ...(room.playerB ? [{ kind: "send" as const, clientId: room.playerB, message: payload }] : []),
  ]

  return { kind: "ok" as const, notifications }
}

export function handleBecomeSpectator(ctx: RoomActionContext): ActionResult {
  try {
    becomeSpectator(ctx.roomId, ctx.clientId)
  } catch (e) {
    return { kind: "error", message: (e as Error).message }
  }

  const room = ctx.room
  const spectators = getSpectators(ctx.roomId)
  const players = [
    { clientId: room.playerA, ready: room.playerAReady, name: getClientName(room.playerA) },
  ]
  if (room.playerB) {
    players.push({ clientId: room.playerB, ready: room.playerBReady, name: getClientName(room.playerB) })
  }

  const notifications: Notification[] = [
    { kind: "send" as const, clientId: room.playerA, message: { type: "roomUpdate" as const, players, roomStatus: room.status, spectators } },
    ...(room.playerB ? [{ kind: "send" as const, clientId: room.playerB, message: { type: "roomUpdate" as const, players, roomStatus: room.status, spectators } }] : []),
    { kind: "send" as const, clientId: ctx.clientId, message: { type: "roomUpdate" as const, players, roomStatus: room.status, spectators } },
    { kind: "broadcastLobby" as const },
  ]
  return { kind: "ok" as const, notifications }
}

export function handleKickToSpectator(ctx: RoomActionContext): ActionResult {
  try {
    const { kickedId } = kickToSpectator(ctx.roomId, ctx.clientId)
    
    const room = ctx.room
    const spectators = getSpectators(ctx.roomId)
    const players = [
      { clientId: room.playerA, ready: false, name: getClientName(room.playerA) },
    ]

    const notifications: Notification[] = [
      { kind: "send" as const, clientId: kickedId, message: { type: "kicked" as const, reason: "You were moved to spectators by the host" } },
      { kind: "send" as const, clientId: room.playerA, message: { type: "roomUpdate" as const, players, roomStatus: "waiting" as const, spectators } },
      { kind: "broadcastLobby" as const },
    ]
    return { kind: "ok" as const, notifications }
  } catch (e) {
    return { kind: "error", message: (e as Error).message }
  }
}

export function handleCreateBotRoom(ctx: NoRoomActionContext & { difficulty: string }): ActionResult {
  const difficulty = (ctx.difficulty as Difficulty) || "medium"
  const room = createBotRoom(ctx.clientId, difficulty)

  const players = [
    { clientId: room.playerA, ready: true, name: getClientName(room.playerA) },
    { clientId: room.playerB!, ready: true, name: `Bot (${difficulty})` },
  ]

  const notifications: Notification[] = [
    { kind: "send" as const, clientId: ctx.clientId, message: { type: "roomCreated" as const, roomId: room.roomId } },
    { kind: "send" as const, clientId: ctx.clientId, message: { type: "roomUpdate" as const, players, roomStatus: room.status } },
    { kind: "send" as const, clientId: ctx.clientId, message: { type: "gameStart" as const, yourColor: room.colors!.a, roomId: room.roomId, opponentId: room.botClientId! } },
    { kind: "send" as const, clientId: ctx.clientId, message: { type: "boardUpdate" as const, board: room.gameState!.board, turn: room.gameState!.turn, moveCount: 0, inCheck: false } },
    { kind: "broadcastLobby" as const },
  ]

  return { kind: "ok" as const, notifications }
}

export const roomActions = {
  createRoom: handleCreateRoom,
  joinLobby: handleJoinLobby,
  joinRoom: handleJoinRoom,
  kickPlayer: handleKickPlayer,
  leaveRoom: handleLeaveRoom,
  joinAsSpectator: handleJoinAsSpectator,
  leaveSpectate: handleLeaveSpectate,
  becomeSpectator: handleBecomeSpectator,
  kickToSpectator: handleKickToSpectator,
  createBotRoom: handleCreateBotRoom as any,
}
