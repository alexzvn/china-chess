# Player↔Spectator Swap

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## What to build

Allow players to become spectators (voluntary) and hosts to demote players to spectators (forced). Only allowed in waiting or finished states, not during active game.

## Acceptance criteria

- [ ] Server accepts `becomeSpectator(roomId)` action - player gives up slot, moves to spectators list
- [ ] Server accepts `kickPlayer(roomId, asSpectator: true)` option - kicks player to spectators instead of removing
- [ ] Both actions only work when room status is "waiting" or "finished"
- [ ] Return error if attempted during "playing" status
- [ ] When player becomes spectator: slot cleared, ready state cleared, room goes to waiting
- [ ] Client shows "Become Spectator" button in pre-game mode
- [ ] Host sees "Kick to Spectator" option in player list

## Blocked by

- 02-spectator-infrastructure (needs spectator list support)