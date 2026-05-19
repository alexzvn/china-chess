# Chinese Chess Online Game — Context

## Project Purpose

A full-stack online multiplayer Chinese Chess (象棋/中国象棋) game. Two players connect via WebSocket, browse a lobby of open rooms, and play Chinese Chess in real time with rule enforcement by the server.

## Key Domain Concepts

- **Chinese Chess (象棋):** A two-player board game played on a 9×10 grid. Each player starts with 16 pieces.
- **Board:** 9 files (columns) × 10 ranks (rows). River (楚河漢界) between rank 4 and rank 5. Palace on each side (3×3 with diagonal lines).
- **Pieces (32 total):**
  - Red: 車 馬 炮 士 象 帥 兵 (×2, ×2, ×2, ×2, ×2, ×1, ×5)
  - Black: 車 馬 砲 士 象 將 卒 (×2, ×2, ×2, ×2, ×2, ×1, ×5)
  - Note: Red uses 炮, Black uses 砲 for the cannon.
- **Movement rules:**
  - 車 (Chariot): Slide any distance orthogonally.
  - 馬 (Horse): L-shape (2+1), blocked if a piece occupies the "leg" square adjacent in the first direction.
  - 炮/砲 (Cannon): Slide any distance orthogonally; capture by jumping over exactly one piece (screen).
  - 士 (Advisor): One step diagonally, confined to the palace.
  - 象/象 (Elephant): Two steps diagonally, blocked if the "eye" square is occupied, cannot cross the river.
  - 帥/將 (General/King): One step orthogonally, confined to the palace.
  - 兵/卒 (Soldier): One step forward; after crossing the river, also one step sideways. Never backward.
- **Check:** The king is under attack by an enemy piece.
- **Checkmate:** The king is in check and no legal move removes the check.
- **Stalemate:** The player has no legal moves but the king is not in check — this is a loss.
- **Red moves first** (traditional Chinese Chess convention).
- **Pre-game:** The phase after both players join a room but before the game starts. Both players see the board in starting position and toggle their ready state.
- **Ready state:** A toggleable boolean indicating a player is prepared to start the game. Toggled via `toggleReady` client action. The game transitions from `waiting` to `playing` only when both players are ready. Ready can be toggled off (un-ready).
- **roomUpdate:** Server → client message containing the current player list and their ready states. Sent on room creation, player join, ready toggle, and reconnection.
- **Board flip:** The board renders 180° rotated when the player is assigned Black. Both ranks and files are mirrored (`9 - rank`, `8 - file`) so Black's pieces appear at the bottom. This is a pure rendering concern — engine coordinates remain 0-indexed regardless of flip.
- **Host:** The player who created the room (`playerA`). Only the host can kick the opponent and delete the room by leaving.
- **Kick:** The host removes the opponent (`playerB`) from the room. The room resets to `waiting`, `playerB` becomes `null`, ready states and game state are cleared. The room stays in the lobby for new players. The kicked player receives a `kicked` message and is sent to the lobby.
- **Game-over state:** The transient phase after a game ends (`finished` status) and before a rematch decision is made. Both players see a countdown timer, a "Rematch" button, and a "Back to Lobby" button. The room resets to `waiting` only when both players have entered the rematch state.
- **Rematch:** Either player initiates by clicking "Rematch" during the game-over state. The room resets to `waiting` only when both players have accepted. Both players return to pre-game mode and must toggle ready again. Colors are re-randomized.
- **Countdown:** A timer displayed during the game-over state. If neither player acts before the countdown expires, both players auto-enter the rematch state and the room resets to `waiting`.

## Relationships

- A **Room** has exactly one **Host** (`playerA`) and zero or one opponent (`playerB`).
- The **Host** can **Kick** the opponent, which resets the **Room** to `waiting`.
- A **Game-over state** follows a completed game and precedes a **Rematch** decision.
- A **Rematch** resets the **Room** to `waiting` only after both players accept.
- A **Countdown** runs during the **Game-over state** and triggers auto-rematch if it expires.
- If the **Host** leaves a **Room**, the **Room** is deleted. If only the opponent leaves, the **Room** stays with the **Host**.

## Example dialogue

> **Dev:** "When the **Host** **Kick**s the opponent, does the **Room** go to `finished` or `waiting`?"
> **Domain expert:** "`waiting`. The **Room** stays in the lobby so a new player can join."
>
> **Dev:** "Can one player start a **Rematch** alone, or do both have to agree?"
> **Domain expert:** "Both must agree — either by clicking or by the **Countdown** expiring for both."
>
> **Dev:** "What happens if the **Host** leaves during the **Game-over state**?"
> **Domain expert:** "The **Room** is deleted entirely."

## Architecture Overview

```
chess/
  src/
    server/
      types.ts        — Board, Piece, Move, Room, GameState types
      game/           — Chinese Chess engine (move validation, check, checkmate)
        engine.ts     — Move validation, check/checkmate/stalemate detection
        board.ts      — Board representation and initial position
      rooms.ts        — Room lifecycle, lobby state
      index.ts        — Entry point, Elysia app setup, WebSocket message routing
    vue/
      components/
        Board.vue       — Chess board grid rendering
        Piece.vue       — Individual piece rendering
        RoomCard.vue    — Lobby room entry card
        ChatPanel.vue   — Chat messages and input
        SidePanel.vue   — Side panel (dual-mode: pre-game player list with ready
        │                  status, or in-game player turn/check info) + chat
        Board.vue       — Chess board grid with 180° flip support
        Piece.vue       — Individual piece rendering
      views/
        Lobby.vue       — Room listing and create room
        Game.vue        — Full game view (board + chat + info)
      App.vue           — Router outlet
      main.ts           — Entry point
  public/               — Vite build output (served by Elysia)
  docs/
    adr/                — Architectural Decision Records
```

## Coding Conventions

- **TypeScript:** Strict mode (`strict: true`, `noUncheckedIndexedAccess: true`).
- **Formatting:** Standard TypeScript formatting (no Prettier override yet). Tailwind CSS classes use the standard utility-first approach.
- **Naming:** camelCase for variables/functions, PascalCase for types/components, UPPER_SNAKE_CASE for constants.
- **Error handling:** Return `status(code, message)` from Elysia handlers. WebSocket errors sent as `{ type: "error", code, message }`.
- **Logging:** Structured JSON logs for room lifecycle, player actions, chat messages.
- **Testing:** `bun test` for server/engine, Vitest for Vue.
- **Styling:** Tailwind CSS — utility-first, no custom CSS files. Config in `tailwind.config.ts`.
- **Composables:** VueUse/core — reusable composables (`useLocalStorage`, `useMediaQuery`, `useWindowSize`, `useMouse`, `useElementSize`, etc.).

## Key File Locations

- Game engine: `src/server/game/engine.ts`
- Board representation: `src/server/game/board.ts`
- Room management: `src/server/rooms.ts`
- WebSocket handler: `src/server/index.ts`
- Server entry: `src/server/index.ts`
- Vue components: `src/vue/components/`
- Vue views: `src/vue/views/`
- ADRs: `docs/adr/`
- PRD: `.scratch/chinese-chess-online-game/issue.md`
- Game Room UI Overhaul PRD: `.scratch/game-room-ui-overhaul/issue.md`
- Slice 1 (board flip + size): `.scratch/18-board-flip-size/issue.md`
- Slice 2 (server broadcast): `.scratch/19-server-room-broadcast/issue.md`
- Slice 3 (side panel + ready): `.scratch/20-side-panel-ready-flow/issue.md`
