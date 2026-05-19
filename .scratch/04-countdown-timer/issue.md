# 04 — Countdown Timer

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## Parent

`.scratch/room-lifecycle-and-theme/issue.md`

## What to build

A countdown timer displayed during the game-over state. If neither player acts before the countdown expires, both players auto-enter the rematch state (equivalent to clicking "Rematch").

### Server: game-end timestamp

Extend the `gameEnd` server message to include an `expiresAt` timestamp:

- `{ type: "gameEnd", result: string, winnerColor: string | null, reason: string, expiresAt: number }`
- `expiresAt` is `Date.now() + COUNTDOWN_MS` (e.g., 30 seconds from now).
- The server sends this to both players when the game ends.

### Server: auto-rematch on timeout

Add server-side countdown tracking:

- When a game ends, store `rematchDeadline` on the Room: `room.rematchDeadline = Date.now() + COUNTDOWN_MS`.
- Start a `setTimeout` in the server that fires after `COUNTDOWN_MS`.
- When the timeout fires: if both players have accepted rematch, do nothing (already handled). If one or both haven't accepted, auto-accept for those who haven't. If both are now accepted, reset the room to `waiting`.
- If a player leaves before the timeout, clear the timeout and handle room cleanup normally.

### Frontend: countdown timer display

In `SidePanel.vue`, add countdown timer display in game-over mode:

- Show a prominent countdown timer (e.g., "New game in 25s").
- Format as `MM:SS` (e.g., "00:30" → "00:25" → ... → "00:00").
- When the countdown reaches 0 and the player hasn't acted: auto-click rematch.
- When the player has already clicked "Rematch" or "Back to Lobby": hide the timer.
- When the opponent has acted: hide the timer (or show "Opponent accepted — waiting for you...").

### Frontend: countdown logic in Game.vue

In `Game.vue`, add countdown state:

- `countdownExpiresAt: number | null` — received from server in `gameEnd` message.
- `countdownRemaining: number` — computed from `countdownExpiresAt - Date.now()`.
- `useEffect`/`watch` that updates `countdownRemaining` every second.
- When `countdownRemaining <= 0` and player hasn't acted: call `rematch()`.
- Clear countdown when player clicks "Rematch" or "Back to Lobby".

### Frontend: countdown in pre-game mode after rematch

After both players accept rematch and the room resets to `waiting`:

- The countdown is no longer shown (we're back to pre-game mode).
- Players use the normal ready flow.

## Acceptance criteria

- [ ] `gameEnd` message includes `expiresAt` timestamp (server timestamp + COUNTDOWN_MS)
- [ ] COUNTDOWN_MS constant is defined (e.g., 30000 = 30 seconds)
- [ ] Server stores `rematchDeadline` on Room when game ends
- [ ] Server auto-accepts rematch for players who haven't acted when countdown expires
- [ ] Server clears countdown timeout if a player leaves early
- [ ] Countdown timer displays in SidePanel game-over mode
- [ ] Timer shows `MM:SS` format, counting down from 30s
- [ ] Timer updates every second
- [ ] Timer hides after player clicks "Rematch" or "Back to Lobby"
- [ ] Timer hides when opponent has acted
- [ ] Auto-rematch triggers when countdown reaches 0 and player hasn't acted
- [ ] Countdown works correctly across page reloads (remains until original `expiresAt`)
- [ ] Countdown tests in `src/server/rooms.test.ts` or `src/server/ws.test.ts`: auto-rematch on timeout, timeout cleared on leave

## Blocked by

- `.scratch/03-rematch-flow/issue.md` (needs game-over UI and rematch action to exist)
