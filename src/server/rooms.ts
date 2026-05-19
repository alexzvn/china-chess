import { nanoid } from "nanoid"
import type { GameState } from "./game/engine"
import { createInitialBoard } from "./game/board"

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
}

const rooms = new Map<string, Room>()

export function createRoom(clientId: string): Room {
  const room: Room = {
    roomId: nanoid(7),
    createdAt: new Date().toISOString(),
    playerA: clientId,
    playerB: null,
    playerAReady: false,
    playerBReady: false,
    status: "waiting",
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

export function toggleReady(roomId: string, clientId: string): { room: Room; gameStarted: boolean } {
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
    const result = startGame(roomId)
    return { room, gameStarted: true }
  }

  return { room, gameStarted: false }
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

  return {
    room,
    colors: { a: colors[0]!, b: colors[1]! },
  }
}

export function getLobbyRooms(): Room[] {
  return Array.from(rooms.values()).filter((r) => r.status === "waiting")
}

export function kickPlayer(roomId: string, kickerId: string): Room {
  const room = rooms.get(roomId)
  if (!room) throw new Error("Room not found")
  if (kickerId !== room.playerA) throw new Error("Only the host can kick")
  if (!room.playerB) throw new Error("No player to kick")

  room.playerB = null
  room.playerAReady = false
  room.playerBReady = false
  room.status = "waiting"
  delete room.gameState
  delete room.colors

  return room
}
