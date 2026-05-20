# Last Move Highlight — UI Reference for Newly Placed Moves

**Status:** needs-triage
**Labels:** enhancement, ready-for-agent

## Problem Statement

After a move is made, both players see the updated board but have no visual cue showing *where* the move was made. On a dense board with many pieces, it's hard to spot the change, especially for the opponent who might have been looking away or reading chat. Standard chess UIs (both Western and Chinese Chess) highlight the source and destination squares of the last move.

## Solution

Highlight the "from" and "to" squares of the most recent move on both players' boards. The server already sends `lastMove: { from, to }` in `boardUpdate` messages; the client needs to render these highlights.

## User Stories

1. As a player, when I make a move, I want the source square I moved from to show a subtle highlight, so that I can confirm the origin of my move.
2. As a player, I want the destination square of the last move to show a bright highlight, so that I can instantly spot where my opponent placed their piece.
3. As a player, I want the last-move highlights to persist while I'm selecting my next piece, so that I can continue to reference where the last move was made.
4. As a player, I want the last-move highlights to remain visible after the game ends, so that I can see the final move.
5. As a player, when I reconnect to a game mid-session, I want the last-move highlights to be restored, so that I don't lose context.
6. As a player, I want the highlights to clear when the room resets (rematch, kick, leave), so that a fresh game starts with no stale highlights.

## Implementation Decisions

### Engine (`src/server/game/engine.ts`)

Add `lastMove?: { from: Position; to: Position }` to the `GameState` interface. `makeMove()` stores `{ from, to }` in the returned state. This ensures the engine is the authoritative record and any code reading `gameState` automatically gets `lastMove`.

### Server adapters

- **`handleMove`** (`game.ts`): Already sends `lastMove` in `boardUpdate`. Can optionally use `result.lastMove` instead of `ctx.from`/`ctx.to` for consistency.
- **`handleRejoinRoom`** (`phase.ts`): Include `ctx.room.gameState.lastMove` in the reconnection `boardUpdate`. Previously sent `boardUpdate` without `lastMove`.
- Room reset (rematch/kick/leave): Implicitly clears via `delete room.gameState`.

### Client composable (`useBoard.ts`)

Add `lastMove` ref, `setLastMove(move)`, and `clearLastMove()`. Expose all three. This follows the existing pattern where `board`, `turn`, `inCheckColor` are managed by the composable.

### Client `Game.vue`

- On `boardUpdate`: call `setLastMove(msg.lastMove ?? null)` alongside `setBoard()` and `setTurn()`.
- On room reset (`roomUpdate` with `waiting`): call `clearLastMove()`.
- Pass `lastMove` as a prop to `Board.vue`.

### Client `Board.vue`

Accept a `lastMove` prop of type `{ from: Position; to: Position } | null`. Render two overlay divs inside each cell:

- **"From" square**: `bg-amber-300/30 dark:bg-amber-600/30` — subtle golden tint.
- **"To" square**: `bg-yellow-300/50 dark:bg-yellow-500/40` — brighter yellow tint.

These render at `z-[1]` — above the board background texture but below the river text and pieces.

### Lifecycle rules

| Event | lastMove behavior |
|---|---|
| New move (`boardUpdate` with `lastMove`) | Replace with new value |
| Room resets to waiting (rematch/kick/leave) | Clear |
| Player clicks a cell / selects a piece | Persist |
| Board flip (re-render) | Persist |
| Game over (`gameEnd` received) | Persist |
| Reconnection | Restore from server (`gameState.lastMove`) |

### Why store `lastMove` in GameState (Option A) vs. only in the adapter (Option B)

Option A was chosen because `GameState` is the authoritative record of game history. Adding `lastMove` there guarantees every consumer (handleMove, handleRejoinRoom, future features like move replay) sees it without special plumbing. The cost is one optional field in the interface.

### Why manage `lastMove` in useBoard (Option B) vs. Game.vue (Option A)

Option B was chosen because `useBoard` already owns all board-display state (`board`, `selectedPos`, `legalMoves`, `inCheckColor`, `turn`). Adding `lastMove` there keeps lifecycle and exposure consistent — `Board.vue` receives one more prop from the same source, and `Game.vue` doesn't need to manage display-only state inline.

## Files to Modify

1. `src/server/game/engine.ts` — Add `lastMove` to `GameState`, populate in `makeMove`
2. `src/server/actions/phase.ts` — `handleRejoinRoom` sends `lastMove` in `boardUpdate`
3. `src/vue/src/composables/useBoard.ts` — Add `lastMove` state + setters
4. `src/vue/src/views/Game.vue` — Wire `setLastMove`/`clearLastMove` to messages, pass prop
5. `src/vue/src/components/Board.vue` — Accept prop, render highlights

## Out of Scope

- Move history list / move replay
- Animated piece transitions
- Differentiating last move highlight color per player (both see the same)
- Highlighting the king when in check (already done via `inCheckColor`)

## Testing Decisions

- **useBoard composable**: Verify `setLastMove` sets ref, `clearLastMove` nulls it, `setBoard` does NOT clear lastMove.
- **Board.vue**: Snapshot test with lastMove set verifies highlight divs render at correct grid coordinates. Snapshot with lastMove=null verifies no highlight divs.
- **handleRejoinRoom adapter**: Unit test verifies `boardUpdate` includes `lastMove` when `gameState.lastMove` is set, and omits it when undefined.
- **makeMove**: Test that returned GameState includes expected lastMove.
