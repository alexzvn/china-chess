# Extended Game Rules

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## What to build

Add three tournament rules to the game engine: General face-to-face prohibition, perpetual chase detection, and insufficient material detection.

## Acceptance criteria

- [ ] `isValidMove` rejects moves that expose generals to face each other (same file, no pieces between)
- [ ] Engine tracks move history (last N positions)
- [ ] After each move, check for perpetual chase: if same position repeats > 3 times OR same chasing sequence, declare draw
- [ ] Add `isInsufficientMaterial(board)` function detecting unwinnable positions
- [ ] Check insufficient material after each move; if true, end game as draw
- [ ] Add tests for all three rules

## Blocked by

None - can start immediately