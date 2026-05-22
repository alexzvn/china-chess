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

  it("deducts elapsed time from mover, opponent unchanged", () => {
    const room = createRoom("host")
    room.playerB = "player-b"
    room.playerAReady = true
    room.playerBReady = true
    const result = startGame(room.roomId)
    // Force color assignment: playerA = red, playerB = black
    room.colors = { a: "red", b: "black" }
    const initialTimeA = result.room.timeA!
    const initialTimeB = result.room.timeB!
    
    // Simulate 5 seconds passing (red/playerA was thinking)
    room.lastTimeUpdate = Date.now() - 5000
    
    applyTimeControl(room.roomId, "red")
    
    const updated = getRoom(room.roomId)!
    // Red (playerA) loses elapsed thinking time (5s), no increment
    expect(updated.timeA).toBe(initialTimeA - 5)
    // Opponent's time should NOT change (they weren't on the clock)
    expect(updated.timeB).toBe(initialTimeB)
  })

  it("clamps time at zero not negative", () => {
    const room = createRoom("host")
    room.playerB = "player-b"
    room.playerAReady = true
    room.playerBReady = true
    startGame(room.roomId)
    room.colors = { a: "red", b: "black" }
    // Set time very low
    room.timeA = 2
    room.lastTimeUpdate = Date.now() - 10000  // 10s elapsed
    
    applyTimeControl(room.roomId, "red")
    
    const updated = getRoom(room.roomId)!
    // timeA = 2 - 10 = -8, clamped to 0
    expect(updated.timeA).toBe(0)
  })

  it("correctly maps color to player when playerA is black", () => {
    const room = createRoom("host")
    room.playerB = "player-b"
    room.playerAReady = true
    room.playerBReady = true
    startGame(room.roomId)
    // Force color assignment: playerA = black, playerB = red
    room.colors = { a: "black", b: "red" }
    const initialTimeA = room.timeA!
    const initialTimeB = room.timeB!
    
    // Simulate 3 seconds passing (black/playerA was thinking)
    room.lastTimeUpdate = Date.now() - 3000
    
    applyTimeControl(room.roomId, "black")
    
    const updated = getRoom(room.roomId)!
    // PlayerA (black) was thinking: loses 3s
    expect(updated.timeA).toBe(initialTimeA - 3)
    // PlayerB (red, opponent) time should stay unchanged
    expect(updated.timeB).toBe(initialTimeB)
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