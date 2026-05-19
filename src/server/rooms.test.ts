import { describe, it, expect } from "bun:test"
import { createRoom, getRoom, getLobbyRooms, joinRoom, startGame, toggleReady } from "./rooms"

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
      toggleReady(room.roomId, "client-a")
      toggleReady(room.roomId, "client-b")
      expect(() => joinRoom(room.roomId, "client-c")).toThrow("Room is not joinable")
    })
  })

  describe("startGame", () => {
    it("sets status to playing and assigns colors", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      toggleReady(room.roomId, "client-a")
      toggleReady(room.roomId, "client-b")

      const updated = getRoom(room.roomId)!
      expect(updated.status).toBe("playing")
      expect(updated.colors).toBeDefined()
      expect(updated.colors!.a).not.toBe(updated.colors!.b)
    })

    it("removes the room from lobby after start", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      toggleReady(room.roomId, "client-a")
      toggleReady(room.roomId, "client-b")

      const lobby = getLobbyRooms()
      expect(lobby.find((r) => r.roomId === room.roomId)).toBeUndefined()
    })

    it("throws if room has no playerB", () => {
      const room = createRoom("client-a")
      expect(() => startGame(room.roomId)).toThrow("Room is not ready")
    })

    it("throws if not both players ready", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      toggleReady(room.roomId, "client-a")
      expect(() => startGame(room.roomId)).toThrow("Not all players ready")
    })
  })

  describe("toggleReady", () => {
    it("toggles playerA ready from false to true", () => {
      const room = createRoom("client-a")
      expect(room.playerAReady).toBe(false)
      toggleReady(room.roomId, "client-a")
      expect(room.playerAReady).toBe(true)
    })

    it("toggles playerA ready from true back to false", () => {
      const room = createRoom("client-a")
      toggleReady(room.roomId, "client-a")
      expect(room.playerAReady).toBe(true)
      toggleReady(room.roomId, "client-a")
      expect(room.playerAReady).toBe(false)
    })

    it("toggles playerB ready state", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")

      toggleReady(room.roomId, "client-b")
      expect(room.playerBReady).toBe(true)

      toggleReady(room.roomId, "client-b")
      expect(room.playerBReady).toBe(false)
    })

    it("returns gameStarted=false when only one player ready", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      const result = toggleReady(room.roomId, "client-a")
      expect(result.gameStarted).toBe(false)
      expect(room.status).toBe("waiting")
    })

    it("returns gameStarted=true when both players ready", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")

      toggleReady(room.roomId, "client-a")
      const result = toggleReady(room.roomId, "client-b")
      expect(result.gameStarted).toBe(true)
      expect(room.status).toBe("playing")
    })

    it("unreadying after both were ready resets game start", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")

      toggleReady(room.roomId, "client-a")
      let result = toggleReady(room.roomId, "client-b")
      expect(result.gameStarted).toBe(true)

      // Unready playerB
      result = toggleReady(room.roomId, "client-b")
      expect(result.gameStarted).toBe(false)
      expect(room.status).toBe("waiting")
    })

    it("throws if client is not in the room", () => {
      const room = createRoom("client-a")
      expect(() => toggleReady(room.roomId, "stranger")).toThrow("Client not in room")
    })

    it("throws if room not found", () => {
      expect(() => toggleReady("nonexistent", "client-a")).toThrow("Room not found")
    })
  })
})
