import { describe, it, expect } from "bun:test"
import { createRoom, getRoom, getLobbyRooms, joinRoom, startGame } from "./rooms"

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
    const room1 = createRoom("client-a")
    const room2 = createRoom("client-b")
    const lobby = getLobbyRooms()

    expect(lobby.length).toBeGreaterThanOrEqual(2)
    const ids = lobby.map((r) => r.roomId)
    expect(ids).toContain(room1.roomId)
    expect(ids).toContain(room2.roomId)
  })

  describe("joinRoom", () => {
    it("sets playerB and returns the room", () => {
      const room = createRoom("client-a")
      const updated = joinRoom(room.roomId, "client-b")

      expect(updated.playerB).toBe("client-b")
      expect(updated.status).toBe("waiting")
    })

    it("throws if room does not exist", () => {
      expect(() => joinRoom("nonexistent", "client-b")).toThrow("Room not found")
    })

    it("throws if room is already full", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      expect(() => joinRoom(room.roomId, "client-c")).toThrow("Room is full")
    })

    it("throws if room is not in waiting status", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      startGame(room.roomId)
      expect(() => joinRoom(room.roomId, "client-c")).toThrow("Room is not joinable")
    })
  })

  describe("startGame", () => {
    it("sets status to playing and assigns colors", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      const result = startGame(room.roomId)

      expect(result.room.status).toBe("playing")
      expect(["red", "black"]).toContain(result.colors.a)
      expect(["red", "black"]).toContain(result.colors.b)
      expect(result.colors.a).not.toBe(result.colors.b)
    })

    it("removes the room from lobby after start", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      startGame(room.roomId)

      const lobby = getLobbyRooms()
      expect(lobby.find((r) => r.roomId === room.roomId)).toBeUndefined()
    })

    it("throws if room has no playerB", () => {
      const room = createRoom("client-a")
      expect(() => startGame(room.roomId)).toThrow("Room is not ready")
    })
  })
})
