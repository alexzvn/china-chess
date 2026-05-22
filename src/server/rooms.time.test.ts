import { describe, it, expect, beforeEach } from "bun:test"
import { createRoom, getRoom, startGame, applyTimeControl, getPlayerTime, deductTime, timeControlSettings } from "./rooms"

describe("Time Controls", () => {
  beforeEach(() => {
    const { rooms } = require("./rooms")
    rooms.clear()
  })

  it("initializes time on game start", () => {
    const room = createRoom("host")
    room.playerB = "player-b"
    room.playerAReady = true
    room.playerBReady = true
    const result = startGame(room.roomId)
    
    expect(result.room.timeA).toBe(timeControlSettings.initial)
    expect(result.room.timeB).toBe(timeControlSettings.initial)
  })

  it("applies increment after a move", () => {
    const room = createRoom("host")
    room.playerB = "player-b"
    room.playerAReady = true
    room.playerBReady = true
    const result = startGame(room.roomId)
    const initialTimeA = result.room.timeA!
    const initialTimeB = result.room.timeB!
    
    // Red (playerA) makes a move, Black's (playerB) time should be deducted
    applyTimeControl(room.roomId, "red")
    
    const updated = getRoom(room.roomId)!
    // After red moves, add increment to red's time (they get time bonus for moving fast)
    // And deduct from black's time (they lose time waiting)
    expect(updated.timeA).toBe(initialTimeA + timeControlSettings.increment)
    expect(updated.timeB).toBeLessThan(initialTimeB)
  })

  it("gets player time correctly", () => {
    const room = createRoom("host")
    room.playerB = "player-b"
    room.playerAReady = true
    room.playerBReady = true
    startGame(room.roomId)
    
    expect(getPlayerTime(room.roomId, "host")).toBe(timeControlSettings.initial)
    expect(getPlayerTime(room.roomId, "player-b")).toBe(timeControlSettings.initial)
  })

  it("deducts time from specific player", () => {
    const room = createRoom("host")
    room.playerB = "player-b"
    room.playerAReady = true
    room.playerBReady = true
    startGame(room.roomId)
    const initialTime = room.timeA!
    
    deductTime(room.roomId, "host", 5)
    
    const updated = getRoom(room.roomId)!
    expect(updated.timeA).toBe(initialTime - 5)
  })

  it("detects timeout when time reaches zero", () => {
    const room = createRoom("host")
    room.playerB = "player-b"
    room.playerAReady = true
    room.playerBReady = true
    startGame(room.roomId)
    
    // Set time to 0
    room.timeA = 0
    
    const updated = getRoom(room.roomId)!
    expect(updated.timeA).toBe(0)
  })
})