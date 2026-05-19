# Chinese Chess Online (象棋)

A full-stack online multiplayer Chinese Chess game built with Bun, ElysiaJS, Vue 3, and Tailwind CSS.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | [Bun](https://bun.sh) |
| Backend | [ElysiaJS](https://elysiajs.com) (HTTP + WebSocket) |
| Frontend | [Vue 3](https://vuejs.org) (Composition API, `<script setup>`) |
| Build | [Vite](https://vitejs.dev) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Composables | [VueUse](https://vueuse.org) |
| State | Plain `ref`/`computed` (no Pinia) |
| Testing | `bun test` (server/engine) + Vitest (Vue) |

## Architecture

```
┌─────────────────────────────────────────────┐
│                 Browser                       │
│  ┌─────────────────────────────────────────┐ │
│  │  Vue 3 + Vite                           │ │
│  │  ┌──────┐ ┌──────┐ ┌──────────┐        │ │
│  │  │Lobby │ │ Game │ │Board/Piece│        │ │
│  │  └──┬───┘ └──┬───┘ └──────────┘        │ │
│  │     └────────┴───────────┐               │ │
│  │                  WebSocket (JSON)        │ │
│  └─────────────────────────────────────────┘ │
│                      │                        │
├──────────────────────┼────────────────────────┤
│  Bun Server (port 3000)                      │
│  ┌─────────────────────────────────────────┐ │
│  │  ElysiaJS                               │ │
│  │  ┌────────┐ ┌──────────┐ ┌──────────┐  │ │
│  │  │ Static │ │WebSocket │ │ Room Mgmt│  │ │
│  │  │ Files  │ │ Handler  │ │          │  │ │
│  │  └────────┘ └────┬─────┘ └──────────┘  │ │
│  │                  │                       │ │
│  │          ┌───────▼───────┐              │ │
│  │          │ Game Engine   │              │ │
│  │          │ (Pure TS)     │              │ │
│  │          └───────────────┘              │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Setup

```bash
# Install dependencies
bun install

# Development — two terminals:
# Terminal 1: Vue dev server (hot reload)
cd src/vue && vite

# Terminal 2: Bun server (auto-restart)
bun run src/server/index.ts

# Production build
cd src/vue && vite build
# Then start the server (serves built Vue app + WebSocket)
bun run src/server/index.ts

# Run tests
bun test
```

## WebSocket Protocol

All messages are JSON. The server assigns a `clientId` (nanoid 7 chars) on connection.

### Client → Server

| Action | Payload | Description |
|--------|---------|-------------|
| `createRoom` | `{ action: "createRoom" }` | Create a new game room |
| `joinLobby` | `{ action: "joinLobby" }` | Subscribe to lobby updates |
| `joinRoom` | `{ action: "joinRoom", roomId }` | Join a specific room |
| `rejoinRoom` | `{ action: "rejoinRoom", roomId, clientId }` | Reconnect to a game |
| `startGame` | `{ action: "startGame", roomId }` | Confirm ready to start |
| `move` | `{ action: "move", roomId, from: {rank, file}, to: {rank, file} }` | Make a move |
| `resign` | `{ action: "resign", roomId }` | Resign the game |
| `drawOffer` | `{ type: "drawOffer", roomId }` | Offer a draw |
| `drawAccept` | `{ type: "drawAccept", roomId }` | Accept draw offer |
| `drawDecline` | `{ type: "drawDecline", roomId }` | Decline draw offer |
| `chat` | `{ type: "chat", roomId, text }` | Send chat message |
| `ping` | `{ type: "ping" }` | Ping/pong heartbeat |

### Server → Client

| Type | Payload | Description |
|------|---------|-------------|
| `connected` | `{ type: "connected", clientId }` | Initial connection acknowledgment |
| `pong` | `{ type: "pong" }` | Ping response |
| `roomCreated` | `{ type: "roomCreated", roomId }` | Room was created |
| `roomJoined` | `{ type: "roomJoined", roomId, player }` | Player joined room |
| `lobbyUpdate` | `{ type: "lobbyUpdate", rooms: Room[] }` | Updated room list |
| `gameStart` | `{ type: "gameStart", yourColor, roomId, opponentId }` | Game has started |
| `boardUpdate` | `{ type: "boardUpdate", board, turn, moveCount, lastMove, inCheck }` | Board state after a move |
| `gameEnd` | `{ type: "gameEnd", result, winnerColor, reason }` | Game has ended |
| `chat` | `{ type: "chat", message: { sender, text, timestamp, color } }` | Chat message |
| `drawOffered` | `{ type: "drawOffered", fromClientId }` | Opponent offered a draw |
| `drawDeclined` | `{ type: "drawDeclined" }` | Draw offer was declined |
| `opponentReconnected` | `{ type: "opponentReconnected" }` | Opponent reconnected |
| `error` | `{ type: "error", code, message }` | Error message |

## Chinese Chess Rules

### Board

- 9 files (columns) × 10 ranks (rows).
- River (楚河漢界) between rank 4 and rank 5.
- Palace: 3×3 area on each side (ranks 0-2 for Black, ranks 7-9 for Red).

### Pieces (32 total)

| Piece | Red | Black | Movement |
|-------|-----|-------|----------|
| Chariot | 車 | 車 | Slide any distance orthogonally |
| Horse | 馬 | 馬 | L-shape (2+1), leg-block if adjacent square occupied |
| Cannon | 炮 | 砲 | Slide; capture by jumping over exactly 1 piece |
| Advisor | 士 | 士 | 1 step diagonally, palace-confined |
| Elephant | 象 | 象 | 2 steps diagonally, eye-blocked, cannot cross river |
| General | 帥 | 將 | 1 step orthogonally, palace-confined |
| Soldier | 兵 | 卒 | Forward only; sideways after crossing river; never backward |

### Game Rules

- **Red moves first.**
- **Check:** King is under attack by an enemy piece.
- **Checkmate:** King in check with no legal moves → loss.
- **Stalemate:** No legal moves but king not in check → loss (Chinese Chess rule).
- **Draw:** By agreement only.

## Component Breakdown

### Server (`src/server/`)

| File | Responsibility |
|------|---------------|
| `index.ts` | Elysia app setup, WS message routing, HTTP static serving |
| `rooms.ts` | Room CRUD, game state lifecycle, initial board |
| `game/engine.ts` | Chinese Chess engine: piece rules, check/checkmate/stalemate |
| `game/board.ts` | Standard starting board position |

### Frontend (`src/vue/src/`)

| Component | Responsibility |
|-----------|---------------|
| `App.vue` | Root component, router outlet |
| `views/Lobby.vue` | Room list, create room button |
| `views/Game.vue` | Full game view: board, chat, controls |
| `components/Board.vue` | 9×10 grid with SVG lines, river, palace, dots |
| `components/Piece.vue` | Unicode piece in circular background |
| `components/RoomCard.vue` | Room entry in lobby list |
| `components/ChatPanel.vue` | Chat messages and input |
| `components/PlayerInfo.vue` | Player color, turn indicator, check status |
| `composables/useWebSocket.ts` | WebSocket connection with auto-reconnect |
| `composables/useBoard.ts` | Board state, selection, legal moves |
| `composables/useSound.ts` | Web Audio API sound effects |
| `router.ts` | Vue Router config (history mode) |

### Tests (`src/server/*.test.ts`)

| File | Tests |
|------|-------|
| `index.test.ts` | HTTP smoke test |
| `ws.test.ts` | WebSocket connect, ping/pong, unique IDs |
| `rooms.test.ts` | Room CRUD, join, startGame |
| `lobby.test.ts` | Lobby creation + broadcast |
| `game-start.test.ts` | Full game start flow |
| `game/engine.test.ts` | All 7 piece movement rules (40 tests) |
| `game/check.test.ts` | Check, checkmate, stalemate, makeMove |

## Development

### Iterative Cycles

The project follows 17 iterative development cycles:

1. Project Scaffold → 2. WebSocket Connect → 3. Room Creation + Lobby → 4. Room Join + Game Start → 5. Game Engine: Pieces → 6. Engine: Check/Checkmate → 7. Board Rendering → 8. Piece Selection + Legal Moves → 9. Move Execution E2E → 10. Turn Indicator + Check Visual → 11. Game Over Display → 12. Chat System → 13. Draw Offer + Resign → 14. Reconnection → 15. Sound Effects → 16. Responsive Polish → 17. Documentation

## Project Structure

```
chess/
├── src/
│   ├── server/
│   │   ├── index.ts          # Elysia app entry point
│   │   ├── rooms.ts          # Room management
│   │   ├── game/
│   │   │   ├── engine.ts     # Game engine (pure TS)
│   │   │   └── board.ts      # Initial board state
│   │   └── *.test.ts         # Server/engine tests
│   └── vue/
│       ├── vite.config.ts    # Vite config
│       ├── index.html        # HTML entry
│       └── src/
│           ├── App.vue       # Root component
│           ├── main.ts        # Vue entry point
│           ├── router.ts      # Vue Router
│           ├── components/    # Vue components
│           ├── views/         # Route views
│           └── composables/   # Vue composables
├── public/                   # Vite build output (served by Elysia)
├── docs/adr/                 # Architecture Decision Records
├── CONTEXT.md                # Domain model and project context
├── README.md                 # This file
└── .scratch/                 # Issue tracker (markdown)
```
