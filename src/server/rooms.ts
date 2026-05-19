import { nanoid } from "nanoid"

export interface Room {
  roomId: string
  createdAt: string
  playerA: string
  playerB: string | null
  status: "waiting" | "playing" | "finished"
}

const rooms = new Map<string, Room>()

export function createRoom(clientId: string): Room {
  const room: Room = {
    roomId: nanoid(7),
    createdAt: new Date().toISOString(),
    playerA: clientId,
    playerB: null,
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

export function startGame(roomId: string): GameStartResult {
  const room = rooms.get(roomId)
  if (!room) throw new Error("Room not found")
  if (!room.playerB) throw new Error("Room is not ready")

  const colors: ("red" | "black")[] = ["red", "black"]
  // Randomly shuffle: 50/50 chance of either assignment
  if (Math.random() < 0.5) colors.reverse()

  room.status = "playing"

  return {
    room,
    colors: { a: colors[0]!, b: colors[1]! },
  }
}

export function getLobbyRooms(): Room[] {
  return Array.from(rooms.values()).filter((r) => r.status === "waiting")
}
