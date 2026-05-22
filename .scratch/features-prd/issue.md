# Chinese Chess Online Game — Feature PRD

**Status:** ready-for-agent
**Labels:** enhancement, feature

## Overview

Enhance the Chinese Chess online game with 9 new features: back-to-lobby button, tournament rules, undo moves, spectator mode, player name customization, and player vs bot support.

---

## Feature 1: Back to Lobby During Game

### Description
Add a "Back to Lobby" button visible at the bottom of the board during active gameplay. Clicking it shows a confirmation dialog. Confirming counts as a forfeit (loss).

### Implementation

**Server (rooms.ts):**
- Modify `leaveRoom` to accept a `forfeit` parameter
- If client is host (`playerA`) and forfeits: delete room
- If client is playerB and forfeits: reset room to waiting (playerB = null, clear game state)

**Client (Game.vue):**
- Add "Forfeit & Leave" button at board bottom
- Show confirmation dialog on click: "Are you sure? You'll forfeit the game."
- On confirm: send `leaveRoom` action with forfeit flag

**Protocol:**
- New client → server action: `{ "action": "leaveRoom", "roomId": "...", "forfeit": true }`

---

## Feature 2: Tournament Rules

### 2a. Time Controls

**Server (rooms.ts + game engine):**
- Add `timeA: number` and `timeB: number` to Room (seconds remaining)
- Add `timeControl: { initial: number, increment: number }` to Room
- On each move: add increment to mover's time, deduct from opponent's active time
- On timeout: end game with winner by timeout

**Protocol:**
- New server → client message: `{ "type": "timeUpdate", "timeA": 300, "timeB": 300 }`
- Client sends move with timestamp: `{ "action": "move", "roomId": "...", "from": {...}, "to": {...}, "clientTimestamp": 1234567890 }`

**Client:**
- Display timer for each player in SidePanel
- Countdown animation

### 2b. General Face-to-Face Rule (將帥照面)

**Server (game/engine.ts):**
- In `isValidMove` and `getLegalMoves`: add check that move doesn't expose generals to face each other
- If 帥 and 將 are on same file with no pieces between: illegal move

### 2c. Perpetual Chase (長捉)

**Server (game/engine.ts):**
- Track last N moves (e.g., last 10)
- If same piece position repeats > 3 times OR same chasing sequence: declare draw

### 2d. Insufficient Material

**Server (game/engine.ts):**
- Add `isInsufficientMaterial(board)` check
- End game as draw if neither side can attack/destroy the General

---

## Feature 3: Undo Last Move

### Description
Players can request to undo the most recent move. Opponent must accept. Unlimited requests allowed. Response time deducts from player's clock.

### Implementation

**Server:**
- Add `undoRequest: { from: string, expiresAt: number } | null` to Room
- Action `requestUndo`: set pending undo request, start countdown
- Action `acceptUndo`: revert last move, swap turn back
- Action `declineUndo`: reject, clear request

**Protocol:**
- New server → client: `{ "type": "undoRequested", "from": "clientId", "expiresAt": 1234567890 }`
- New client → server: `{ "action": "acceptUndo", "roomId": "..." }` / `{ "action": "declineUndo", "roomId": "..." }`

**Client (SidePanel.vue):**
- Add "Request Undo" button in-game
- Show dialog when opponent requests undo: "Accept undo?" with Accept/Decline buttons

---

## Feature 4: Spectator Mode

### Description
Any room can have unlimited spectators. They see board + chat and can chat.

### Implementation

**Server (rooms.ts):**
- Add `spectators: string[]` to Room
- Add action `joinAsSpectator(roomId)`
- Add action `leaveSpectate(roomId)`
- Modify `broadcast` to include spectators

**Protocol:**
- New client → server: `{ "action": "joinAsSpectator", "roomId": "..." }`
- New server → client: `{ "type": "spectatorUpdate", "spectators": ["id1", "id2"] }`

**Client:**
- Lobby: add "Watch" button to RoomCard
- Game view: if spectator, show read-only board (no move controls)
- Spectators can chat

---

## Feature 5: Guest to Join Empty Slot

### Description
Any WebSocket client can join an empty player slot (playerB).

### Implementation
This should already work with current `joinRoom` action. No changes needed.

---

## Feature 6: Player ↔ Spectator Swap

### Description
- Voluntary: player clicks "Become Spectator" to give up slot
- Host-forced: host kicks player to spectator

### Implementation

**Server (rooms.ts):**
- Add action `becomeSpectator(roomId)`: move player from playerB → spectators, reset slot
- Modify `kickPlayer` to have option: `{ "action": "kickPlayer", "roomId": "...", "asSpectator": true }`
- Only allow in `waiting` or `finished` status

**Protocol:**
- New client → server: `{ "action": "becomeSpectator", "roomId": "..." }`
- Modified kick: `{ "action": "kickPlayer", "roomId": "...", "asSpectator": true }`

---

## Feature 7: Custom Player Name

### Description
Players can set a display name (max 16 chars, Unicode). Persists server-side across reconnections.

### Implementation

**Server:**
- Add `clientNames: Map<string, string>` (in-memory or persisted)
- Add action `setName(name: string)` — validates length (max 16), stores
- Include name in `RoomPlayer`: `{ clientId, ready, name }`

**Protocol:**
- New client → server: `{ "action": "setName", "name": "..." }`
- Modified `roomUpdate` message includes `name` field

**Client:**
- Lobby: add "Set Name" button/dialog
- Display name in SidePanel, RoomCard, chat messages

---

## Feature 8: Room Preview with Owner Name

### Description
Lobby room cards show host's display name + player count (including spectators).

### Implementation

**Client (RoomCard.vue):**
- Display: "Host: [name]" (or "Host: [clientId]" if no name set)
- Display: "Players: 2/2" or "Players: 1/2 + 3 spectating"

**Server:**
- Modify `lobbyUpdate` to include host name

---

## Feature 9: Player vs Bot

### Description
Server-side bot with 5 difficulty levels: Beginner, Easy, Medium, Hard, Expert.

### Implementation

**Server:**
- Create `BotEngine` class with difficulty levels
- Bot logic based on minimax with depth varying by difficulty:
  - Beginner: depth 1, random moves 30%
  - Easy: depth 2, random moves 20%
  - Medium: depth 3, random moves 10%
  - Hard: depth 4
  - Expert: depth 5+
- Add `createBotRoom(difficulty)` action
- Add `BotPlayer` client type — managed by server

**Protocol:**
- New client → server: `{ "action": "createBotRoom", "difficulty": "medium" }`
- Bot automatically joins as playerB, ready immediately, game starts

**Client:**
- Lobby: add "Play vs Bot" button that opens difficulty selection modal
- Same game view as human vs human

---

## Dependencies

| Feature | Depends On |
|---------|------------|
| Feature 3 (Undo) | Feature 2 (Time controls) |
| Feature 4 (Spectators) | — |
| Feature 9 (Bot) | Feature 4 (Spectators) — bot is like a permanent "player" |

---

## Out of Scope

- Move notation (recording moves in Chinese Chess notation)
- Touch-move rule
- AI opponent on client-side
- Tournament brackets/scoring

---

## Timeline Priority

1. Feature 1 (Back button) — High, simple
2. Feature 7 (Names) — Medium, foundational
3. Feature 8 (Room preview) — Low, cosmetic
4. Feature 4 (Spectators) — Medium, core
5. Feature 2 (Tournament rules) — High, complex
6. Feature 3 (Undo) — Medium, depends on time controls
7. Feature 5 (Guest join) — Low, already works
8. Feature 6 (Player↔Spectator) — Low, depends on 4
9. Feature 9 (Bot) — Medium, substantial