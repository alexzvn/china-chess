# 19 — Server Room State Broadcast

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## Parent

`.scratch/game-room-ui-overhaul/issue.md`

## What to build

Extend the server's room management to support a pre-game ready phase with state broadcasting.

### Room model changes (`rooms.ts`)

- Add `playerAReady: boolean` and `playerBReady: boolean` to the `Room` interface
- Add `toggleReady(roomId, clientId)` function:
  - Toggles the calling player's ready state (true → false or false → true)
  - When both players are ready, calls `startGame()` and returns `{ room, gameStarted: true }`
  - If only one player readies, returns `{ room, gameStarted: false }`
- `startGame()` already requires both players present; additionally require both readied

### WebSocket handler changes (`index.ts`)

- Add `broadcastRoomUpdate(roomId)` function sending:
  ```json
  {
    "type": "roomUpdate",
    "players": [
      { "clientId": "abc1234", "ready": true, "color": "red" },
      { "clientId": "xyz7890", "ready": false, "color": null }
    ],
    "board": [[...]]  // starting position
  }
  ```
- Call `broadcastRoomUpdate` after: `createRoom`, `joinRoom`, `toggleReady`, `reclaimRoom`
- Rename `startGame` WebSocket action to `toggleReady`
- Remove the external `readyConfirmations` Map — ready state now lives on the Room model
- `broadcastLobbyUpdate` still works as before (only shows `waiting` rooms in lobby, not ready status)

### Tests

- `toggleReady` toggles playerA's state without affecting playerB
- Toggling both players to `true` triggers game start
- Toggling one player back to `false` after being ready does NOT start the game
- `startGame` fails if not both players ready
- `broadcastRoomUpdate` sends correct shape

## Acceptance criteria

- [ ] Room has `playerAReady` and `playerBReady` boolean fields
- [ ] Server broadcasts `roomUpdate` on room creation, player join, ready toggle, and reconnection
- [ ] `toggleReady` is a two-way toggle (can un-ready)
- [ ] Game starts only when both players have `true` ready state
- [ ] `readyConfirmations` Map in index.ts is removed (replaced by Room model fields)
- [ ] All existing tests still pass
- [ ] New tests cover toggleReady and both-ready triggers game start

## Blocked by

None — can start immediately.

## Triage

- [ ] Accepted
- [ ] Rejected
- [ ] Needs refinement
