# 28 — Engine records lastMove + reconnection restores it

**Status:** needs-triage
**Labels:** enhancement

## Parent

`.scratch/last-move-highlight/issue.md`

## What to build

Store the last move in the engine's `GameState` so it persists in the room model and can be sent to reconnecting players.

Add `lastMove?: { from: Position; to: Position }` to the `GameState` interface. `makeMove()` populates it when a move succeeds. `handleRejoinRoom` reads `gameState.lastMove` and includes it in the `boardUpdate` sent to the reconnecting player.

## Acceptance criteria

- [ ] `GameState` interface has optional `lastMove` field in `engine.ts`
- [ ] `makeMove()` stores `{ from, to }` in the returned `GameState`
- [ ] `handleRejoinRoom` in `phase.ts` sends `lastMove` in `boardUpdate` when `gameState.lastMove` is set
- [ ] `handleRejoinRoom` omits `lastMove` when `gameState.lastMove` is undefined (fresh game)
- [ ] Unit test: `makeMove` returns expected `lastMove`
- [ ] Unit test: `handleRejoinRoom` includes `lastMove` in message payload
- [ ] Unit test: `handleRejoinRoom` omits `lastMove` when no moves have been made
- [ ] `bun test` passes

## Blocked by

- `27-last-move-client-render` (for end-to-end verification; engine change is code-independent, but the reconnection scenario needs the client to render the highlight)
