# Extended Game Rules

**Status:** ready-for-human
**Labels:** ready-for-human, enhancement

## What to build

Add three tournament rules to the game engine: General face-to-face prohibition, perpetual chase detection, and insufficient material detection.

## Acceptance criteria

- [x] `isValidMove` rejects moves that expose generals to face each other (same file, no pieces between)
- [x] Engine tracks move history (last N positions)
- [x] After each move, check for perpetual chase: if same position repeats > 3 times OR same chasing sequence, declare draw
- [x] Add `isInsufficientMaterial(board)` function detecting unwinnable positions
- [x] Check insufficient material after each move; if true, end game as draw
- [x] Add tests for all three rules
- [x] Wire perpetual chase + insufficient material into `handleMove` game flow
- [x] Fix river text centering on board (percentage-based positioning matching SVG viewBox)
- [x] Fix game-over overlay to cover board instead of being a side panel card

## Blocked by

None - can start immediately