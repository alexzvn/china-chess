# Undo Last Move

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## What to build

Players can request to undo the most recent move. Opponent must accept or decline. Response time deducts from player's clock. Unlimited requests allowed.

## Acceptance criteria

- [ ] Room model includes `undoRequest: { from: string, expiresAt: number } | null`
- [ ] Server accepts `requestUndo(roomId)` action
- [ ] Server accepts `acceptUndo(roomId)` action - reverts last move, swaps turn back
- [ ] Server accepts `declineUndo(roomId)` action - rejects, clears request
- [ ] Server broadcasts `undoRequested` message with expiresAt timestamp
- [ ] If response time exceeds deadline: auto-decline
- [ ] Response time deducts from requester's game clock
- [ ] Client shows "Request Undo" button in SidePanel during game
- [ ] Client shows dialog when opponent requests undo: "Accept undo?" with Accept/Decline

## Blocked by

- 03-time-controls (response time deducts from player's clock)