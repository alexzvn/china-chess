# 20 — Side Panel + Ready Flow + Game Info

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## Parent

`.scratch/game-room-ui-overhaul/issue.md`

## What to build

Restructure Game.vue from a vertical stack to a board + side panel side-by-side layout. Create a SidePanel.vue component with two modes.

### Layout

```
┌─────────────┐  ┌──────────────────────┐
│             │  │  Player Info / Ready  │
│    Board    │  │                      │
│  (always    │  ├──────────────────────┤
│   visible)  │  │     Chat             │
│             │  │                      │
└─────────────┘  └──────────────────────┘
```

- Responsive: side-by-side on desktop (md: breakpoint), stacked on mobile
- Board renders immediately on room join, not gated by `gameStarted`

### SidePanel.vue — Pre-game mode

Shows when `status === "waiting"`:
- Player A row: client ID + ready badge ("Ready ✓" / "Not Ready")
- Player B row: client ID (or "Waiting for opponent...") + ready badge
- Toggleable "Ready" button (changes to "Waiting for opponent..." with pulse animation when readied)
- Disabled button if player B hasn't joined yet

### SidePanel.vue — In-game mode

Shows when `status === "playing"`:
- Player row for each side with:
  - Color dot (red/black circle)
  - "You" badge if this is the current client
  - Active turn highlight (yellow border around whose turn it is)
  - Check indicator (red pulse + "CHECK!" text)
- ChatPanel remains embedded below

### Game.vue changes

- Import and render SidePanel.vue beside Board.vue
- Pass `roomState` derived from server messages
- Handle `roomUpdate` message: update player list, ready statuses
- Board is always rendered but non-interactive before `gameStarted`
- On `gameStart`: board becomes interactive (`@cell-click` works), SidePanel switches to in-game mode
- ChatPanel is removed from direct rendering — it lives inside SidePanel

### WebSocket messages handled

- `roomUpdate`: update player list and ready statuses, render board (starting position)
- `gameStart`: switch to in-game mode
- `boardUpdate`: update board (existing logic)
- `gameEnd`: disable board, show result in side panel

## Acceptance criteria

- [ ] Game.vue has a board + side panel side-by-side layout (responsive)
- [ ] Board renders immediately on room join, showing starting position
- [ ] Pre-game: SidePanel shows both players with ready status badges
- [ ] Pre-game: Ready button toggles via `toggleReady` action; shows "Waiting for opponent..." with visual feedback
- [ ] Pre-game: game starts only when both ready (via existing server logic)
- [ ] In-game: SidePanel shows "You are Red/Black", turn indicator, check status
- [ ] In-game: ChatPanel is visible below player info
- [ ] Board is non-interactive before game starts, interactive after
- [ ] All existing game functionality (moves, chat, draw, resign) still works

## Blocked by

- `.scratch/19-server-room-broadcast/issue.md`

## Triage

- [ ] Accepted
- [ ] Rejected
- [ ] Needs refinement
