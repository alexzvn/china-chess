import { describe, it, expect } from "bun:test"
import { createRoom, getRoom, getLobbyRooms } from "./rooms"

describe("Rooms", () => {
  it("creates a room with waiting status and the creator as playerA", () => {
    const room = createRoom("client-abc")

    expect(room.roomId).toMatch(/^[a-zA-Z0-9_-]{7}$/)
    expect(room.playerA).toBe("client-abc")
    expect(room.playerB).toBeNull()
    expect(room.status).toBe("waiting")
    expect(room.createdAt).toBeDefined()
  })

  it("stores the room and makes it retrievable by roomId", () => {
    const room = createRoom("client-abc")
    const retrieved = getRoom(room.roomId)

    expect(retrieved).toBeDefined()
    expect(retrieved!.roomId).toBe(room.roomId)
    expect(retrieved!.playerA).toBe("client-abc")
  })

  it("lists only waiting rooms in the lobby", () => {
    // Clean slate: only waiting rooms
    const room1 = createRoom("client-a")
    const room2 = createRoom("client-b")
    const lobby = getLobbyRooms()

    expect(lobby.length).toBeGreaterThanOrEqual(2)
    // Both rooms should be in the lobby since they're waiting
    const ids = lobby.map((r) => r.roomId)
    expect(ids).toContain(room1.roomId)
    expect(ids).toContain(room2.roomId)
  })
})
