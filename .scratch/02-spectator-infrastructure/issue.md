# Spectator Infrastructure

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## What to build

Allow unlimited spectators in any room. Spectators see board state and chat, can chat, but cannot move. Spectators are separate from the 2-player slots.

## Acceptance criteria

- [ ] Room model includes `spectators: string[]` array
- [ ] Server accepts `joinAsSpectator(roomId)` action
- [ ] Server accepts `leaveSpectate(roomId)` action
- [ ] `spectatorUpdate` message broadcasts to room (players + spectators)
- [ ] Spectators receive `boardUpdate` messages
- [ ] Spectators can send/receive chat messages
- [ ] Client shows "Watch" button on RoomCard in Lobby
- [ ] Client renders game view as read-only for spectators (no move controls)

## Blocked by

None - can start immediately