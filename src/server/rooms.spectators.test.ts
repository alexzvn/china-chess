import { describe, it, expect, beforeEach } from "bun:test"
import { createRoom, getRoom, joinRoom, joinAsSpectator, leaveSpectate, getSpectators, isSpectator } from "./rooms"

describe("Spectators", () => {
  beforeEach(() => {
    // Clear rooms between tests
    const { rooms } = require("./rooms")
    rooms.clear()
  })

  it("adds a spectator to a room", () => {
    const room = createRoom("host-123")
    const result = joinAsSpectator(room.roomId, "spectator-456")

    expect(result).toBeDefined()
    expect(result.spectators).toContain("spectator-456")
    expect(result.spectators.length).toBe(1)
  })

  it("allows multiple spectators", () => {
    const room = createRoom("host-123")
    joinAsSpectator(room.roomId, "spectator-1")
    joinAsSpectator(room.roomId, "spectator-2")
    joinAsSpectator(room.roomId, "spectator-3")

    const updated = getRoom(room.roomId)!
    expect(updated.spectators.length).toBe(3)
  })

  it("removes a spectator from a room", () => {
    const room = createRoom("host-123")
    joinAsSpectator(room.roomId, "spectator-456")
    leaveSpectate(room.roomId, "spectator-456")

    const updated = getRoom(room.roomId)!
    expect(updated.spectators).not.toContain("spectator-456")
  })

  it("checks if a client is a spectator", () => {
    const room = createRoom("host-123")
    joinAsSpectator(room.roomId, "spectator-456")

    expect(isSpectator(room.roomId, "spectator-456")).toBe(true)
    expect(isSpectator(room.roomId, "host-123")).toBe(false)
    expect(isSpectator(room.roomId, "non-existent")).toBe(false)
  })

  it("getSpectators returns array of spectator clientIds", () => {
    const room = createRoom("host-123")
    joinAsSpectator(room.roomId, "spectator-1")
    joinAsSpectator(room.roomId, "spectator-2")

    const specs = getSpectators(room.roomId)
    expect(specs).toEqual(["spectator-1", "spectator-2"])
  })

  it("allows spectators in playing rooms", () => {
    const room = createRoom("host-123")
    joinRoom(room.roomId, "player-b")
    
    // Room is still waiting, start game by setting status
    room.status = "playing"
    room.gameState = { board: [], turn: "red", moveCount: 0 }
    
    const result = joinAsSpectator(room.roomId, "spectator-456")
    expect(result.spectators).toContain("spectator-456")
  })
})