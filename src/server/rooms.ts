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

export function getLobbyRooms(): Room[] {
  return Array.from(rooms.values()).filter((r) => r.status === "waiting")
}
