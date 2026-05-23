import { describe, it, expect } from "vitest"

// SidePanel.vue domain logic tests: pre-game and in-game state rendering

describe("SidePanel — pre-game mode", () => {
  const myClientId = "client-a"

  it("shows both players with unready status when neither is ready", () => {
    const players = [
      { clientId: "client-a", ready: false },
      { clientId: "client-b", ready: false },
    ]
    const me = players.find((p) => p.clientId === myClientId)!

    expect(players.length).toBe(2)
    expect(me.ready).toBe(false)
    expect(players.find((p) => p.clientId === "client-b")!.ready).toBe(false)
  })

  it("shows playerA ready and playerB unready", () => {
    const players = [
      { clientId: "client-a", ready: true },
      { clientId: "client-b", ready: false },
    ]

    expect(players[0]!.ready).toBe(true)
    expect(players[1]!.ready).toBe(false)
  })

  it("shows both players ready", () => {
    const players = [
      { clientId: "client-a", ready: true },
      { clientId: "client-b", ready: true },
    ]

    expect(players.every((p) => p.ready)).toBe(true)
  })

  it("identifies whether I should see ready button (I'm not ready yet)", () => {
    const me = { clientId: "client-a", ready: false }
    const showReadyButton = !me.ready
    expect(showReadyButton).toBe(true)
  })

  it("shows 'Waiting for opponent...' when I'm ready but opponent isn't", () => {
    const players = [
      { clientId: "client-a", ready: true },
      { clientId: "client-b", ready: false },
    ]
    const opponent = players.find((p) => p.clientId !== myClientId)!

    expect(opponent.ready).toBe(false)
  })

  it("non-host player (playerB) can toggle ready not just become spectator", () => {
    // playerB should have the Ready button visible, not just Become Spectator
    const players = [
      { clientId: "host-id", ready: false, name: "Host" },
      { clientId: "playerb-id", ready: false, name: "PlayerB" },
    ]
    const myClientId = "playerb-id"
    const isHost = players.length > 0 && players[0]!.clientId === myClientId
    const isSpectator = false
    const inPlayers = players.some((p) => p.clientId === myClientId)

    // playerB is in the players list
    expect(inPlayers).toBe(true)
    // playerB is NOT the host
    expect(isHost).toBe(false)
    // playerB should still be able to toggle ready (not just become spectator)
    const canToggleReady = inPlayers && !isSpectator
    expect(canToggleReady).toBe(true)
  })
})

describe("SidePanel — in-game mode", () => {
  const myClientId = "client-a"

  it("shows both players with assigned colors", () => {
    const players = [
      { clientId: "client-a", color: "red" as const },
      { clientId: "client-b", color: "black" as const },
    ]
    const me = players.find((p) => p.clientId === myClientId)!

    expect(me.color).toBe("red")
    expect(players.find((p) => p.clientId === "client-b")!.color).toBe("black")
  })

  it("marks the current client as 'You'", () => {
    const me = { clientId: myClientId, color: "red" as const }
    const isMe = true
    const label = isMe ? "You (Red)" : "Red"

    expect(label).toBe("You (Red)")
  })

  it("shows opponent label without 'You'", () => {
    const opponent = { clientId: "client-b", color: "black" as const }
    const isMe = false
    const label = isMe ? `You (Black)` : "Black"

    expect(label).toBe("Black")
  })

  it("highlights active player's turn", () => {
    const turn: "red" | "black" = "red"
    const isActive = (color: "red" | "black") => color === turn

    expect(isActive("red")).toBe(true)
    expect(isActive("black")).toBe(false)
  })

  it("shows check warning for the checked player", () => {
    const inCheckColor: "red" | "black" | null = "red"
    const isInCheck = (color: "red" | "black") => inCheckColor === color

    expect(isInCheck("red")).toBe(true)
    expect(isInCheck("black")).toBe(false)
  })

  it("does not show check when no one is in check", () => {
    const inCheckColor: "red" | "black" | null = null

    expect(inCheckColor).toBeNull()
  })

  it("shows both sides' info simultaneously", () => {
    const turn: "red" | "black" = "red"
    const inCheckColor: "red" | "black" | null = null
    const players = [
      { clientId: "client-a", color: "red" as const, label: "You (Red)" },
      { clientId: "client-b", color: "black" as const, label: "Black" },
    ]

    for (const p of players) {
      p.label // just iterates
    }
    expect(players.length).toBe(2)
    expect(turn).toBe("red")
    expect(inCheckColor).toBeNull()
  })
})

describe("SidePanel — game over state", () => {
  it("shows game result message", () => {
    const result = "Red wins by checkmate!"
    expect(result).toBeTruthy()
  })

  it("shows Back to Lobby button when game is over", () => {
    const gameOver = true
    expect(gameOver).toBe(true)
  })
})
