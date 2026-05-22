# Time Controls

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## What to build

Implement game clock with initial time + increment per move. Each player has a countdown timer. Timeout results in loss. Undo request response time deducts from player's clock.

## Acceptance criteria

- [ ] Room model includes `timeA` and `timeB` (seconds remaining)
- [ ] Room model includes `timeControl: { initial: number, increment: number }`
- [ ] On game start: initialize both clocks to initial time (e.g., 10 minutes)
- [ ] On each move: add increment to mover's time, deduct from opponent's time
- [ ] Server broadcasts `timeUpdate` message after each time change
- [ ] Server detects timeout: game ends with winner by timeout
- [ ] Client displays countdown timer for each player in SidePanel
- [ ] Undo request has deadline: response time deducted from requester's clock

## Blocked by

None - can start immediately