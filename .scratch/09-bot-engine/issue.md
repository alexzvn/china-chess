# Bot Engine (Minimax)

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## What to build

Server-side bot with minimax algorithm and alpha-beta pruning. Five difficulty levels: Beginner, Easy, Medium, Hard, Expert. Evaluation function considers material + position.

## Acceptance criteria

- [ ] Create `BotEngine` class with evaluation function (piece values + position bonuses)
- [ ] Implement minimax with alpha-beta pruning
- [ ] Difficulty settings:
  - Beginner: depth 1, 30% random moves
  - Easy: depth 2, 20% random moves
  - Medium: depth 3, 10% random moves
  - Hard: depth 4
  - Expert: depth 5+
- [ ] Bot can evaluate any board position
- [ ] Bot returns best move for given color
- [ ] Add tests for evaluation function
- [ ] Add tests for minimax search

## Blocked by

- 02-spectator-infrastructure (bot uses similar player slot pattern)