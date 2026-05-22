# Guest Join Empty Slot (Verify)

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## What to build

Verify that any WebSocket client can join an empty player slot (playerB). This is expected to work with current implementation.

## Acceptance criteria

- [ ] Any client can call `joinRoom` on a waiting room with empty playerB slot
- [ ] Room rejects join if status is not "waiting"
- [ ] Room rejects join if playerB is already filled

## Blocked by

None - can start immediately

## Notes

This is a verification task. If current code already supports this, mark as complete. If not, implement the missing parts.