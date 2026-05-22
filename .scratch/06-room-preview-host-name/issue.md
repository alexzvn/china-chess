# Room Preview with Host Name

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## What to build

Lobby room cards display host's display name and player count (including spectators).

## Acceptance criteria

- [ ] `lobbyUpdate` message includes host's display name
- [ ] RoomCard displays "Host: [name]" (or "Host: [clientId prefix]" if no name set)
- [ ] RoomCard displays player count: "1/2" or "2/2 + 3 spectating"
- [ ] Player count updates when spectators join/leave

## Blocked by

- 01-player-names (needs name storage to display)