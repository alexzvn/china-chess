import { nanoid } from "nanoid"
import type { GameState } from "./game/engine"
import { createInitialBoard } from "./game/board"

// Time control settings (can be made configurable later)
export const timeControlSettings = {
  initial: 600, // 10 minutes in seconds
  increment: 10, // 10 seconds per move
  maxTime: 1800, // 30 minutes max
}

export interface Room {
  roomId: string
  createdAt: string
  playerA: string
  playerB: string | null
  playerAReady: boolean
  playerBReady: boolean
  status: "waiting" | "playing" | "finished"
  gameState?: GameState
  colors?: { a: "red" | "black"; b: "red" | "black" }
  rematchAcceptedA: boolean
  rematchAcceptedB: boolean
  spectators: string[]
  timeA?: number // seconds remaining for playerA
  timeB?: number // seconds remaining for playerB
  lastTimeUpdate?: number // timestamp of last time update
}

const rooms = new Map<string, Room>()

export { rooms } // For testing

export function createRoom(clientId: string): Room {
  const room: Room = {
    roomId: nanoid(7),
    createdAt: new Date().toISOString(),
    playerA: clientId,
    playerB: null,
    playerAReady: false,
    playerBReady: false,
    status: "waiting",
    rematchAcceptedA: false,
    rematchAcceptedB: false,
    spectators: [],
  }
  rooms.set(room.roomId, room)
  return room
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId)
}

export function joinRoom(roomId: string, clientId: string): Room {
  const room = rooms.get(roomId)
  if (!room) throw new Error("Room not found")
  if (room.status !== "waiting") throw new Error("Room is not joinable")
  if (room.playerB) throw new Error("Room is full")

  room.playerB = clientId
  return room
}

export interface GameStartResult {
  room: Room
  colors: { a: "red" | "black"; b: "red" | "black" }
}

export function toggleReady(roomId: string, clientId: string): { room: Room } {
  const room = rooms.get(roomId)
  if (!room) throw new Error("Room not found")

  if (clientId === room.playerA) {
    room.playerAReady = !room.playerAReady
  } else if (clientId === room.playerB) {
    if (!room.playerB) throw new Error("Room is not ready")
    room.playerBReady = !room.playerBReady
  } else {
    throw new Error("Client not in room")
  }

  // If unreadying after game had started, revert to waiting
  if (room.status === "playing" && !(room.playerAReady && room.playerBReady)) {
    room.status = "waiting"
    delete room.colors
    delete room.gameState
  }

  // Check if both players are ready
  if (room.playerAReady && room.playerBReady && room.playerA && room.playerB) {
    startGame(roomId)
  }

  return { room }
}

export function startGame(roomId: string): GameStartResult {
  const room = rooms.get(roomId)
  if (!room) throw new Error("Room not found")
  if (!room.playerB) throw new Error("Room is not ready")
  if (!room.playerAReady || !room.playerBReady) throw new Error("Not all players ready")

  const colors: ("red" | "black")[] = ["red", "black"]
  // Randomly shuffle: 50/50 chance of either assignment
  if (Math.random() < 0.5) colors.reverse()

  room.status = "playing"
  room.colors = { a: colors[0]!, b: colors[1]! }
  room.gameState = {
    board: createInitialBoard(),
    turn: "red",
    moveCount: 0,
  }
  
  // Initialize time controls
  room.timeA = timeControlSettings.initial
  room.timeB = timeControlSettings.initial
  room.lastTimeUpdate = Date.now()

  return {
    room,
    colors: { a: colors[0]!, b: colors[1]! },
  }
}

export function getLobbyRooms(): Room[] {
  return Array.from(rooms.values()).filter((r) => r.status === "waiting")
}

export function findRoomByClientId(clientId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.playerA === clientId || room.playerB === clientId) {
      return room
    }
  }
  return undefined
}

export function deleteRoom(roomId: string): void {
  rooms.delete(roomId)
}

export interface RematchResult {
  room: Room
  bothAccepted: boolean
}

export function rematch(roomId: string, clientId: string): RematchResult {
  const room = rooms.get(roomId)
  if (!room) throw new Error("Room not found")
  if (room.status !== "finished") throw new Error("Game not finished")

  if (clientId === room.playerA) {
    room.rematchAcceptedA = true
  } else if (clientId === room.playerB) {
    room.rematchAcceptedB = true
  } else {
    throw new Error("Client not in room")
  }

  const bothAccepted = room.rematchAcceptedA && room.rematchAcceptedB

  // If both accepted, reset the room
  if (bothAccepted) {
    room.playerAReady = false
    room.playerBReady = false
    room.status = "waiting"
    room.colors = undefined
    room.gameState = undefined
    room.rematchAcceptedA = false
    room.rematchAcceptedB = false
  }

  return { room, bothAccepted }
}

export function resign(roomId: string, clientId: string): Room {
  const room = rooms.get(roomId)
  if (!room) throw new Error("Room not found")
  if (room.status !== "playing") throw new Error("Game not active")

  room.status = "finished"
  return room
}

export function leaveRoom(roomId: string, clientId: string): Room {
  const room = rooms.get(roomId)
  if (!room) throw new Error("Room not found")

  if (clientId === room.playerA) {
    // Host leaves — delete room
    rooms.delete(roomId)
    return room
  }

  // playerB leaves — reset to waiting
  room.playerB = null
  room.playerAReady = false
  room.playerBReady = false
  room.status = "waiting"
  delete room.gameState
  delete room.colors
  room.rematchAcceptedA = false
  room.rematchAcceptedB = false

  return room
}

export function kickPlayer(roomId: string, kickerId: string): { room: Room; kickedId: string } {
  const room = rooms.get(roomId)
  if (!room) throw new Error("Room not found")
  if (kickerId !== room.playerA) throw new Error("Only the host can kick")
  if (!room.playerB) throw new Error("No player to kick")

  const kickedId = room.playerB!
  room.playerB = null
  room.playerAReady = false
  room.playerBReady = false
  room.status = "waiting"
  delete room.gameState
  delete room.colors
  room.rematchAcceptedA = false
  room.rematchAcceptedB = false

  return { room, kickedId }
}

// Spectator functions
export function joinAsSpectator(roomId: string, clientId: string): Room {
  const room = rooms.get(roomId)
  if (!room) throw new Error("Room not found")
  
  // Don't add if already a player or already spectating
  if (room.playerA === clientId || room.playerB === clientId) {
    throw new Error("Client is already in this room as a player")
  }
  if (!room.spectators.includes(clientId)) {
    room.spectators.push(clientId)
  }
  return room
}

export function leaveSpectate(roomId: string, clientId: string): Room {
  const room = rooms.get(roomId)
  if (!room) throw new Error("Room not found")
  
  room.spectators = room.spectators.filter(id => id !== clientId)
  return room
}

export function getSpectators(roomId: string): string[] {
  const room = rooms.get(roomId)
  return room?.spectators ?? []
}

export function isSpectator(roomId: string, clientId: string): boolean {
  const room = rooms.get(roomId)
  if (!room) return false
  return room.spectators.includes(clientId)
}

// Time control functions
export function applyTimeControl(roomId: string, lastMover: "red" | "black"): Room {
  const room = rooms.get(roomId)
  if (!room) throw new Error("Room not found")
  if (!room.timeA || !room.timeB) return room

  // Add increment to the mover's time (they get bonus for making a move)
  if (lastMover === "red") {
    room.timeA = Math.min(room.timeA + timeControlSettings.increment, timeControlSettings.maxTime)
    // Deduct increment from opponent's time
    room.timeB = Math.max(0, room.timeB - timeControlSettings.increment)
  } else {
    room.timeB = Math.min(room.timeB + timeControlSettings.increment, timeControlSettings.maxTime)
    room.timeA = Math.max(0, room.timeA - timeControlSettings.increment)
  }
  
  room.lastTimeUpdate = Date.now()
  return room
}

export function getPlayerTime(roomId: string, clientId: string): number | undefined {
  const room = rooms.get(roomId)
  if (!room) return undefined
  
  if (room.playerA === clientId) return room.timeA
  if (room.playerB === clientId) return room.timeB
  return undefined
}

export function deductTime(roomId: string, clientId: string, seconds: number): Room {
  const room = rooms.get(roomId)
  if (!room) throw new Error("Room not found")
  
  if (room.playerA === clientId && room.timeA !== undefined) {
    room.timeA = Math.max(0, room.timeA - seconds)
  } else if (room.playerB === clientId && room.timeB !== undefined) {
    room.timeB = Math.max(0, room.timeB - seconds)
  }
  
  room.lastTimeUpdate = Date.now()
  return room
}

export function initializeTimeControl(roomId: string): Room {
  const room = rooms.get(roomId)
  if (!room) throw new Error("Room not found")
  
  room.timeA = timeControlSettings.initial
  room.timeB = timeControlSettings.initial
  room.lastTimeUpdate = Date.now()
  
  return room
}

export function getTimeUpdate(roomId: string): { timeA: number; timeB: number } | undefined {
  const room = rooms.get(roomId)
  if (!room || room.timeA === undefined || room.timeB === undefined) return undefined
  
  return { timeA: room.timeA, timeB: room.timeB }
}

export function isTimeOut(roomId: string, color: "red" | "black"): boolean {
  const room = rooms.get(roomId)
  if (!room) return false
  
  if (color === "red") return (room.timeA ?? 0) <= 0
  return (room.timeB ?? 0) <= 0
}
