import { describe, it, expect } from "bun:test"
import { createRoom, getRoom, getLobbyRooms, joinRoom, startGame, toggleReady, kickPlayer, rematch, resign, leaveRoom } from "./rooms"

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

    it("returns room with status=waiting when only one player ready", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      const result = toggleReady(room.roomId, "client-a")
      expect(result.room.status).toBe("waiting")
    })

    it("starts game when both players ready", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")

      toggleReady(room.roomId, "client-a")
      toggleReady(room.roomId, "client-b")
      expect(room.status).toBe("playing")
    })

    it("unreadying after both were ready resets game start", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")

      toggleReady(room.roomId, "client-a")
      toggleReady(room.roomId, "client-b")
      expect(room.status).toBe("playing")

      // Unready playerB
      toggleReady(room.roomId, "client-b")
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

  describe("kickPlayer", () => {
    it("resets room to waiting when host kicks playerB", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      toggleReady(room.roomId, "client-a")
      toggleReady(room.roomId, "client-b")

      kickPlayer(room.roomId, "client-a")
      const updated = getRoom(room.roomId)!

      expect(updated.status).toBe("waiting")
      expect(updated.playerB).toBeNull()
      expect(updated.playerA).toBe("client-a")
      expect(updated.playerAReady).toBe(false)
      expect(updated.playerBReady).toBe(false)
      expect(updated.gameState).toBeUndefined()
      expect(updated.colors).toBeUndefined()
    })

    it("throws if non-host tries to kick", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      expect(() => kickPlayer(room.roomId, "client-b")).toThrow("Only the host can kick")
    })

    it("throws if no player to kick", () => {
      const room = createRoom("client-a")
      expect(() => kickPlayer(room.roomId, "client-a")).toThrow("No player to kick")
    })

    it("throws if room not found", () => {
      expect(() => kickPlayer("nonexistent", "client-a")).toThrow("Room not found")
    })
  })

  describe("rematch", () => {
    it("marks first player as accepted, room stays finished", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      toggleReady(room.roomId, "client-a")
      toggleReady(room.roomId, "client-b")

      // Manually set to finished to simulate game end
      const r = getRoom(room.roomId)!
      r.status = "finished"

      const result = rematch(room.roomId!, "client-a")
      expect(result.bothAccepted).toBe(false)
      expect(getRoom(room.roomId)!.status).toBe("finished")
      expect(getRoom(room.roomId)!.rematchAcceptedA).toBe(true)
    })

    it("resets room to waiting when both players accept", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      toggleReady(room.roomId, "client-a")
      toggleReady(room.roomId, "client-b")

      const r = getRoom(room.roomId)!
      r.status = "finished"
      r.colors = { a: "red" as const, b: "black" as const }
      r.gameState = { board: [], turn: "red" as const, moveCount: 0 }

      rematch(room.roomId!, "client-a")
      rematch(room.roomId!, "client-b")

      const updated = getRoom(room.roomId)!
      expect(updated.status).toBe("waiting")
      expect(updated.playerAReady).toBe(false)
      expect(updated.playerBReady).toBe(false)
      expect(updated.colors).toBeUndefined()
      expect(updated.gameState).toBeUndefined()
    })

    it("throws if client is not in room", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      getRoom(room.roomId)!.status = "finished"
      expect(() => rematch(room.roomId, "stranger")).toThrow("Client not in room")
    })

    it("throws if game not finished", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      expect(() => rematch(room.roomId, "client-a")).toThrow("Game not finished")
    })
  })

  describe("resign", () => {
    it("sets game status to finished and determines winner", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      toggleReady(room.roomId, "client-a")
      toggleReady(room.roomId, "client-b")

      const colorsBefore = getRoom(room.roomId)!.colors!
      const result = resign(room.roomId, "client-a")

      expect(result.status).toBe("finished")
      // client-a resigned; winner is client-a's opponent's color
      const opponentColor = colorsBefore.a === "red" ? "black" : "red"
      expect(result.colors!.a).toBe(colorsBefore.a)
      expect(result.colors!.b).toBe(colorsBefore.b)
    })

    it("preserves room colors when game ends", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      toggleReady(room.roomId, "client-a")
      toggleReady(room.roomId, "client-b")

      const colorsBefore = getRoom(room.roomId)!.colors!
      const result = resign(room.roomId, "client-b")

      expect(result.colors!.a).toBe(colorsBefore.a)
      expect(result.colors!.b).toBe(colorsBefore.b)
    })

    it("throws if room not found", () => {
      expect(() => resign("nonexistent", "client-a")).toThrow("Room not found")
    })

    it("throws if game not active", () => {
      const room = createRoom("client-a")
      expect(() => resign(room.roomId, "client-a")).toThrow("Game not active")
    })
  })

  describe("leaveRoom", () => {
    it("deletes room when host leaves", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      toggleReady(room.roomId, "client-a")
      toggleReady(room.roomId, "client-b")

      leaveRoom(room.roomId, "client-a")

      expect(getRoom(room.roomId)).toBeUndefined()
    })

    it("resets room to waiting when playerB leaves", () => {
      const room = createRoom("client-a")
      joinRoom(room.roomId, "client-b")
      toggleReady(room.roomId, "client-a")
      toggleReady(room.roomId, "client-b")

      leaveRoom(room.roomId, "client-b")

      const updated = getRoom(room.roomId)!
      expect(updated.status).toBe("waiting")
      expect(updated.playerB).toBeNull()
      expect(updated.playerA).toBe("client-a")
      expect(updated.playerAReady).toBe(false)
      expect(updated.playerBReady).toBe(false)
      expect(updated.gameState).toBeUndefined()
      expect(updated.colors).toBeUndefined()
    })

    it("throws if room not found", () => {
      expect(() => leaveRoom("nonexistent", "client-a")).toThrow("Room not found")
    })
  })
})
