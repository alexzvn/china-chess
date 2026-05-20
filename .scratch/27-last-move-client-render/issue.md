# 27 — Client renders lastMove highlight from boardUpdate

**Status:** needs-triage
**Labels:** enhancement

## Parent

`.scratch/last-move-highlight/issue.md`

## What to build

Render visual highlights on the board showing where the last move was played. The server already sends `lastMove: { from, to }` in every `boardUpdate` message — the client just needs to display it.

Add `lastMove` state (ref + setter + clear) to the `useBoard` composable. Wire `Game.vue` to call `setLastMove()` on `boardUpdate` and `clearLastMove()` on room reset. Pass `lastMove` as a prop to `Board.vue`, which renders:

- **"From" square:** `bg-amber-300/30 dark:bg-amber-600/30` overlay
- **"To" square:** `bg-yellow-300/50 dark:bg-yellow-500/40` overlay

Highlights persist across piece selection and game-over. They clear only on room reset or a newer move.

## Acceptance criteria

- [ ] `useBoard.ts` exposes `lastMove` ref, `setLastMove()`, `clearLastMove()`
- [ ] `setBoard()` does NOT clear lastMove (lifecycle rule)
- [ ] `Board.vue` accepts `lastMove` prop and renders from/to highlight divs at `z-[1]`
- [ ] `Game.vue` calls `setLastMove(msg.lastMove ?? null)` on every `boardUpdate`
- [ ] `Game.vue` calls `clearLastMove()` on room reset (`roomUpdate` with `waiting`)
- [ ] Highlights visible for both players regardless of board flip
- [ ] Highlights persist when clicking/piece-selecting (not cleared by `clearSelection()`)
- [ ] Highlights remain visible after `gameEnd`
- [ ] `bun test` passes

## Blocked by

None — server already sends `lastMove` in `boardUpdate`
