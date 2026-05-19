# Game Room UI Overhaul — Board Flip, Side Panel, Pre-game Flow

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## Problem Statement

The current game room UI has several usability problems. The board always shows black at the top regardless of which side the player controls, making it disorienting for black players. The palace diagonal lines are missing due to a template binding bug. The board takes up the full viewport with no size cap, leaving no room for a side panel on desktop. There's no "you are Red/Black" indicator. When a player joins a room, they see nothing until both players ready up. The ready button gives no visual feedback after being clicked.

## Solution

Overhaul the game room view with a board + side panel layout. Fix the palace diagonals (missing `:` v-bind on SVG `x1`/`x2` attributes). Add a `flipped` prop to Board.vue for 180° rotation when playing black. Cap the board size for desktop. Show the board immediately on room join with pieces in starting position. Add a pre-game sidebar showing both players' ready statuses with toggleable ready buttons.

## User Stories

1. As a player, I want to see the palace diagonal X lines (cấm cung) on both sides, so that the board looks authentic.
2. As a player, when I play as Black, I want the board rotated 180° so that my pieces are at the bottom, just like a real chessboard.
3. As a player, I want the board to be a reasonable size on desktop, so that there's room for the chat panel and player info beside it.
4. As a player, I want to see "You are Red" or "You are Black" clearly displayed, so that I know which side I control.
5. As a player, when I join a room, I want to see the board with all pieces in starting position immediately, so that the game feels ready to play.
6. As a player, I want to see both players listed in the side panel with their ready status, so that I know who's in the room and who's ready.
7. As a player, I want to click a "Ready" button to signal I'm ready to play, and see the button change to "Waiting for opponent..." with visual feedback.
8. As a player, I want the Ready button to be toggleable, so that I can un-ready if needed.
9. As a player, I want the game to start only when both players have clicked Ready, so that we both agree to begin.
10. As a player, I want the side panel to show my color and whose turn it is once the game starts, so that I can track the game state.
11. As a player, I want the chat to remain in the side panel below the player info, so that the layout is consistent throughout the game.

## Implementation Decisions

### Modules to Build / Modify

1. **Board.vue (modify)**
   - Fix palace diagonal SVGs: `:x1` and `:x2` bindings were missing the `:` v-bind prefix, causing SVG to receive literal strings `"M + 3 * S"` instead of computed pixel values.
   - Add `flipped` prop (`boolean`). When true, apply 180° rotation:
     - Reverse rank iteration (9→0 instead of 0→9)
     - Mirror file order (8-f instead of f)
     - SVG coordinates computed through transform helpers `sx(file)` and `sy(rank)`
     - River text, palace diagonals, point dots all follow the flipped coordinates
   - Cap board size: `width: min(90vmin, 560px)`, `height: min(100vmin, 622px)`
   - Cells emit board coordinates (0-indexed rank/file) regardless of flip — the click handler in Game.vue always receives engine-native coordinates

2. **SidePanel.vue (new)**
   - A vertical sidebar component that lives beside the board
   - **Pre-game mode**: Shows both players with ready/unready status badges and a toggleable Ready button
   - **In-game mode**: Shows which side each player controls, whose turn it is, and check status
   - Contains the ChatPanel component below the info section
   - Accepts a `roomState` prop derived from the WebSocket messages

3. **Game.vue (modify)**
   - Restructure from vertical stack to board + side panel side-by-side layout (responsive: side by side on desktop, stacked on mobile)
   - Pass `flipped` to Board based on `myColor === "black"`
   - Show board immediately on join (not gated by `gameStarted`)
   - Handle `roomUpdate` server message for pre-game state
   - Pass `toggleReady` action to side panel
   - On `gameStart`: board becomes interactive, side panel switches to in-game mode

4. **Server: rooms.ts (modify)**
   - Add `playerAReady: boolean` and `playerBReady: boolean` fields to `Room` interface
   - Add `toggleReady(roomId, clientId): { room, readyState }` function
   - `startGame()` checks that both players are ready before transitioning to `playing`

5. **Server: index.ts (modify)**
   - Add `broadcastRoomUpdate(roomId)` function that sends to both players:
     ```json
     {
       "type": "roomUpdate",
       "players": [
         { "clientId": "abc1234", "ready": true, "color": "red" },
         { "clientId": "xyz7890", "ready": false, "color": null }
       ],
       "board": [[...]]
     }
     ```
   - Call `broadcastRoomUpdate` after: `createRoom` (player A joins own room), `joinRoom` (player B joins), `toggleReady` (ready status changes), `reclaimRoom` (reconnection)
   - Rename `startGame` WebSocket action to `toggleReady` (semantic: it toggles, doesn't start)
   - When both players are ready, broadcast `gameStart` as before
   - Remove separate `readyConfirmations` Map — ready state lives on the Room model

6. **useRoom.ts (new composable, optional)**
   - Encapsulates room state management: players, ready statuses, game phase, messages
   - Could be extracted if Game.vue becomes too complex; otherwise state stays in Game.vue

### WebSocket Protocol Additions

**New server → client message:**
```
{ "type": "roomUpdate", "players": [...], "board": [[...]] }
```
Sent on room creation, join, ready toggle, and reconnection.

**Renamed client → server action:**
```
{ "action": "toggleReady", "roomId": "abc1234" }
```
Replaces `{ "action": "startGame" }` for the pre-game ready flow.

### Schema Changes

`Room` interface additions:
```ts
export interface Room {
  // ... existing fields
  playerAReady: boolean
  playerBReady: boolean
}
```

## Testing Decisions

### What makes a good test

- Test **external behavior**, not implementation details.
- For the rooms module: test that `toggleReady` toggles the correct player's state, that both ready triggers `startGame`, that un-readying blocks start.
- For Board.vue: test that the `flipped` prop reverses rendering order (component test with vitest).
- For the WebSocket handlers: test that `roomUpdate` is broadcast on the right events.

### Modules to test

1. **rooms.ts** — Add tests for `toggleReady`: toggle on/off, both ready triggers game start, un-ready resets.
2. **Board.vue** — Vitest component test: verify correct DOM order when `flipped` is true vs false.
3. **WebSocket integration** — Existing test setup can verify `roomUpdate` broadcast on join/ready.

### Prior art

- `rooms.test.ts` tests room CRUD with `bun:test` assertions. Follow same pattern for `toggleReady`.
- `Board.vitest.ts` tests component rendering. Follow same pattern for flipped rendering.

## Out of Scope

- Lobby UI changes (room creation, room listing) — not affected by this PRD.
- Game engine changes (piece rules, check/checkmate) — no changes needed.
- Chat functionality changes — ChatPanel keeps working as is, just moves inside SidePanel.
- Sound effects — no changes needed.
- Reconnection flow — the pre-game reconnection (`reclaimRoom`) already works; `broadcastRoomUpdate` improves it by sending board state.
- Mobile responsive layout for the board+side panel layout — to be addressed separately if needed.

## Further Notes

### Coordinate System Clarification

The board flip is a pure rendering concern. The engine always uses 0-indexed `{ rank: 0-9, file: 0-8 }` where rank 0 = black's back rank and file 0 = black's left side (from black's perspective). The 180° flip transforms display coordinates by `displayRank = 9 - rank` and `displayFile = 8 - file`. All click events on the flipped board are translated back to engine coordinates before being sent to the server.

### Pre-game Flow State Machine

```
Room Created (playerA in, waiting)
  → Player B joins (both in, neither ready)
  → Player A readies (playerA=ready, playerB=unready)
  → Player B readies (both ready → game starts → playing)
  → Player A un-readies (playerA=unready, back to playing=unready)
  → (no 3rd player can join — room is "waiting" but full)
```

### Toggleable Ready

Ready is two-way. A player who clicks Ready can click again to un-ready. This handles the case where one player readies prematurely while the other is still deciding. The `roomUpdate` broadcast ensures both clients see every state change immediately.
