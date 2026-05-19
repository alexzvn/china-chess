# 03 — Rematch Flow

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## Parent

`.scratch/room-lifecycle-and-theme/issue.md`

## What to build

After a game ends, both players see a game-over state with "Rematch" and "Back to Lobby" options. The room resets to `waiting` only when both players have accepted rematch (either by clicking or by countdown expiry — countdown is handled in slice 04).

### Server: rematch state tracking

Extend the `Room` type in `src/server/rooms.ts` with two new boolean fields:

- `rematchAcceptedA: boolean` — whether playerA has accepted rematch
- `rematchAcceptedB: boolean` — whether playerB has accepted rematch

Add a `rematch(roomId: string, clientId: string)` function to `src/server/rooms.ts`:

- Validates that `clientId` is either `playerA` or `playerB`.
- Marks the client's rematch acceptance.
- If both players have accepted: resets the room to `waiting` (`playerAReady` = `false`, `playerBReady` = `false`, `rematchAcceptedA` = `false`, `rematchAcceptedB` = `false`, deletes `gameState`, deletes `colors`), re-randomizes colors.
- Returns `{ room, bothAccepted: boolean }`.

### Server: rematch WebSocket handler

Add a `rematch` action handler in `src/server/index.ts`:

- Accepts `{ action: "rematch", roomId }`.
- Calls `rematch(roomId, myClientId)`.
- If both accepted: sends `roomUpdate` to both players with `roomStatus: "waiting"`, resets ready states, clears game state.
- If only one accepted: sends `rematchState` to both players with `{ acceptedA, acceptedB }` so each knows the other's status.

### Server: leaveRoom cleanup

Extend the `leaveRoom` action handler (or disconnect handler) in `src/server/index.ts`:

- If `playerA` (host) leaves: delete the room from the rooms Map.
- If `playerB` leaves: reset the room to `waiting` (`playerB` = `null`, ready states reset, game state cleared), send `roomUpdate` to `playerA`, broadcast `lobbyUpdate`.

### Frontend: game-over state in Game.vue

In `Game.vue`, add state tracking for the game-over phase:

- `rematchAcceptedA: boolean` and `rematchAcceptedB: boolean` — derived from `roomUpdate` or separate `rematchState` messages.
- `rematchAcceptedMyself: boolean` — whether the current player has clicked rematch.
- `gameOver` is already tracked; add logic to detect when both have accepted rematch and reset local state.

Handle new message types:
- `rematchState`: `{ type: "rematchState", acceptedA: boolean, acceptedB: boolean }` — updates rematch tracking.
- `kicked`: `{ type: "kicked", reason: string }` — already handled in slice 02, but needs to work in game-over context too.

When both players have accepted rematch:
- Reset `gameOver.value` to `false`.
- Reset `gameStarted.value` to `false`.
- Set `players` to show both players with ready: false.
- Switch SidePanel to pre-game mode.
- Reset board to starting position.

### Frontend: game-over UI in SidePanel

In `SidePanel.vue`, add a new game-over mode:

- Props: `mode` now includes `"game-over"` as a value.
- When `mode === "game-over"`:
  - Show game result banner (existing game-over display).
  - Show "Rematch" button (emits `rematch` event).
  - Show "Back to Lobby" button (emits `backToLobby` event).
  - If the opponent has accepted rematch, show "Waiting for opponent..." or "Starting new game...".
  - If the opponent has left, show "Opponent left — click Rematch to start a new room" or similar.

### Frontend: rematch handler in Game.vue

In `Game.vue`, add:

- `rematch()` function: sends `{ action: "rematch", roomId }`, sets `rematchAcceptedMyself = true`.
- `backToLobby()` function: sends `{ action: "leaveRoom" }`, navigates to `/`.
- Handle `rematchState` message to update rematch tracking.
- When both accepted, reset local game state and switch to pre-game mode.

### Frontend: backToLobby from game-over

The `backToLobby` function in `Game.vue` should:
- Send `{ action: "leaveRoom" }`.
- Navigate to `/` (lobby).
- Work from any state (pre-game, in-game, game-over, kicked).

### WebSocket protocol

Add new message type: `{ type: "rematchState", acceptedA: boolean, acceptedB: boolean }`

## Acceptance criteria

- [ ] `Room` type has `rematchAcceptedA` and `rematchAcceptedB` boolean fields
- [ ] `rematch(roomId, clientId)` function exists in `src/server/rooms.ts`
- [ ] Rematch by playerA marks `rematchAcceptedA`, sends `rematchState` to both players
- [ ] When both players accept rematch, room resets to `waiting`, ready states reset, game state cleared, colors re-randomized
- [ ] `rematch` action handler exists in `src/server/index.ts`
- [ ] `rematchState` message is sent to both players with correct accepted flags
- [ ] If host leaves room, room is deleted from rooms Map
- [ ] If playerB leaves room, room resets to `waiting` with only host
- [ ] Game-over mode renders in SidePanel with "Rematch" and "Back to Lobby" buttons
- [ ] "Rematch" button emits `rematch` event
- [ ] "Back to Lobby" button emits `backToLobby` event
- [ ] When opponent accepts rematch, UI shows "Waiting for opponent..."
- [ ] Game.vue resets to pre-game state when both players accept rematch
- [ ] `backToLobby` works from game-over state (sends leaveRoom, navigates to lobby)
- [ ] `rematch` tests in `src/server/rooms.test.ts`: first player accepts, second player accepts, room resets
- [ ] WebSocket rematch handler tests in `src/server/ws.test.ts`: rematch triggers correct broadcasts

## Blocked by

None - can start immediately
