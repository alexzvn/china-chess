# 02 — Host Kick

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## Parent

`.scratch/room-lifecycle-and-theme/issue.md`

## What to build

The host (room creator, `playerA`) can kick the opponent (`playerB`) from the room. The room resets to the `waiting` state and stays in the lobby for new players.

### Server: kickPlayer function

Add a `kickPlayer(roomId: string, kickerId: string)` function to `src/server/rooms.ts`:

- Validates that `kickerId === room.playerA` (only host can kick). Throws if not.
- Validates that `room.playerB` is not null (nothing to kick). Throws if null.
- Resets the room to `waiting`: `playerB` = `null`, `playerAReady` = `false`, `playerBReady` = `false`, deletes `gameState`, deletes `colors`.
- Returns the updated `Room`.

### Server: WebSocket kick handler

Add a `kickPlayer` action handler in `src/server/index.ts`:

- Accepts `{ action: "kickPlayer", roomId }` from the host.
- Calls `kickPlayer(roomId, myClientId)`.
- Sends `{ type: "kicked", reason: "You were kicked by the host" }` to the kicked player (playerB).
- Sends `{ type: "roomUpdate", players: [{ clientId: room.playerA, ready: false }], roomStatus: "waiting" }` to the remaining host.
- Broadcasts `lobbyUpdate` so the room reappears in the lobby.

### Frontend: kick button in SidePanel

In `SidePanel.vue`, add a kick button next to the opponent's name in pre-game and in-game modes:

- Only visible when `myClientId === room.playerA` (host) AND `playerB` exists.
- Shows "Kick" text with a danger style (red).
- Emits a `kick` event with the `roomId`.

### Frontend: kick handler in Game.vue

In `Game.vue`, add a `kick` event handler and a `kicked` message handler:

- `kick` handler sends `{ action: "kickPlayer", roomId }`.
- `kicked` message handler: sets an error state, shows a message "You were kicked by the host", and provides a "Back to Lobby" button.
- The `backToLobby` function should work from the kicked state (navigate to `/` without sending `leaveRoom` since the player is already ejected).

### Server: room cleanup on disconnect

Extend the `close` handler in `src/server/index.ts`:

- When a player disconnects, check if they were in a room.
- If `playerA` (host) disconnects: delete the room from the rooms Map.
- If `playerB` disconnects: reset the room to `waiting` (`playerB` = `null`, ready states reset, game state cleared), broadcast `roomUpdate` to `playerA`, broadcast `lobbyUpdate`.

### WebSocket protocol

Add new message type: `{ type: "kicked", reason: string }`

## Acceptance criteria

- [ ] `kickPlayer(roomId, kickerId)` function exists in `src/server/rooms.ts`
- [ ] Kick by host succeeds: room resets to `waiting`, `playerB` = `null`, ready states reset, game state cleared
- [ ] Kick by non-host (playerB) throws an error
- [ ] Kick when `playerB` is null throws an error
- [ ] `kickPlayer` action handler exists in `src/server/index.ts`
- [ ] Kicked player receives `{ type: "kicked", reason }` message
- [ ] Host receives `roomUpdate` showing only themselves
- [ ] Lobby is updated after kick (room reappears with only host)
- [ ] Kick button appears in SidePanel only for host when opponent exists
- [ ] Kick button emits `kick` event
- [ ] Game.vue handles `kicked` message and shows error state with "Back to Lobby" button
- [ ] Host can kick in both pre-game and in-game modes
- [ ] `kickPlayer` tests in `src/server/rooms.test.ts`: kick by host, kick by non-host, kick when no opponent
- [ ] WebSocket kick handler tests in `src/server/ws.test.ts`: kick triggers correct broadcasts

## Blocked by

None - can start immediately
