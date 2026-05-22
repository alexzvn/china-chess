# Player Display Names

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## What to build

Allow players to set a custom display name (max 16 chars, Unicode) that persists server-side across reconnections. Include display name in all player-related messages.

## Acceptance criteria

- [ ] Server accepts `setName` action with validated name (max 16 chars)
- [ ] Client can send `setName` action from Lobby
- [ ] Names persist in memory across reconnection (lookup by clientId)
- [ ] `roomUpdate` message includes `name` field for each player
- [ ] Chat messages show sender's display name
- [ ] Fall back to clientId prefix if no name set

## Blocked by

None - can start immediately