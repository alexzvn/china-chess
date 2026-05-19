# 18 — Board Size Cap + 180° Flip

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## Parent

`.scratch/game-room-ui-overhaul/issue.md`

## What to build

Two changes to Board.vue:

1. **Size cap:** The board uses `90vmin` width which is ~972px on a 1080p desktop — too large. Cap to `min(90vmin, 560px)` / `min(100vmin, 622px)`.

2. **180° flip when playing Black:** Add a `flipped` prop. When true, rotate the board 180° (reverse ranks AND mirror files) so Black's pieces appear at the bottom. SVG grid lines, river text, palace diagonals, point dots, and piece positions all transform accordingly. Click events emit engine-native coordinates (0-indexed rank/file) regardless of flip.

Game.vue passes `:flipped="myColor === 'black'"`.

## Acceptance criteria

- [ ] Board width is capped at a reasonable desktop size (≤560px)
- [ ] Board has a `flipped` prop; when `false`, rendering is unchanged from current behavior
- [ ] When `flipped=true`, the board renders with rank 9 (Red back rank) at the top and rank 0 (Black back rank) at the bottom
- [ ] When `flipped=true`, files are mirrored (Red's left chariot appears on viewer's left)
- [ ] River text 楚河漢界 reads correctly for the viewer's perspective
- [ ] All SVG decorations (palace diagonals, point dots) follow the flipped coordinates
- [ ] Click events always emit engine coordinates (rank 0-9, file 0-8), never display coordinates
- [ ] Game.vue passes `flipped` based on `myColor`

## Blocked by

None — can start immediately.

## Triage

- [ ] Accepted
- [ ] Rejected
- [ ] Needs refinement
