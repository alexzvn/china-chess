# Room Lifecycle & Theme

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## Problem Statement

The Chinese Chess online game has three usability gaps:

1. **No kick mechanism.** The host (room creator) cannot remove the opponent from the room. If a player is AFK, disconnects unexpectedly, or is undesirable, the host has no way to reset the room without both players leaving to the lobby and creating a new room.

2. **No rematch flow.** After a game ends (checkmate, resignation, or draw), both players are forced to leave to the lobby and create or rejoin a room to play again. There is no way to start a new game within the same room.

3. **No theme support.** The application has no dark mode, light mode, or system preference detection. Players who prefer dark themes or who play in low-light environments have no way to adjust the visual appearance.

## Solution

### Kick

The host can kick the opponent from the room. The room resets to the `waiting` state: the opponent slot becomes empty, ready states are cleared, game state is discarded, and the room reappears in the lobby for new players. The kicked player receives a notification and is sent back to the lobby.

### Rematch

After a game ends, both players see a countdown timer and two options: "Rematch" and "Back to Lobby". When both players have entered the rematch state (either by clicking "Rematch" or by the countdown expiring), the room resets to the `waiting` state. Both players return to pre-game mode and must toggle ready again to start a new game. Colors are re-randomized. Players can chat while in the waiting state before readying up.

If one player clicks "Back to Lobby" before both have accepted rematch, that player returns to the lobby. The remaining player can still click "Rematch" to reset the room (now with only themselves as the host, allowing a new player to join), or also return to the lobby.

If the host (playerA) leaves the room, the room is deleted entirely. If only playerB leaves, the room stays with the host.

### Theme

A `useTheme` composable manages three modes: Light, Dark, and System. System mode follows the OS preference via `matchMedia`. The preference is stored in `localStorage`. The `dark` class is applied to the `<html>` element. Tailwind's `darkMode: 'class'` is enabled. All components receive `dark:` variants with smooth CSS transitions between modes. A dropdown in the UI lets players switch between the three modes.

## User Stories

1. As a host (room creator), I want to kick my opponent from the room, so that I can reset the room and find a new opponent without leaving.
2. As a host, I want the room to remain in the lobby after kicking my opponent, so that new players can join.
3. As a kicked player, I want to receive a clear notification that I was kicked, so that I understand why I was removed from the room.
4. As a kicked player, I want to be automatically sent back to the lobby, so that I can find or create a new room.
5. As a host who leaves a room, I want the room to be deleted entirely, so that stale rooms do not linger in the lobby.
6. As a non-host player who leaves a room, I want the room to remain with the host, so that the host can still play or find a new opponent.
7. As a player who just finished a game, I want to see a "Rematch" button, so that I can quickly start a new game without leaving the room.
8. As a player who just finished a game, I want to see a "Back to Lobby" button, so that I can leave the room and browse other rooms.
9. As a player who just finished a game, I want to see a countdown timer, so that I know when a rematch will happen automatically if I do nothing.
10. As a player, I want the room to reset to the waiting state only when both players have entered the rematch state, so that both parties are prepared for a new game.
11. As a player who enters the rematch state, I want to be able to chat while waiting for the opponent to ready up, so that I can communicate before the new game starts.
12. As a player, I want to be able to click "Back to Lobby" before the rematch starts, so that I can leave the room even if my opponent wants to play again.
13. As a player who is the only one remaining in a room after the opponent left, I want to be able to click "Rematch" and have the room reset to waiting with me as the only player, so that a new player can join from the lobby.
14. As a player who is the only one remaining in a room after the host left, I want the room to be deleted, so that I am not stuck in a non-existent room.
15. As a player, I want the new rematch game to have randomly shuffled colors (50/50 red or black), so that the color assignment is fair across multiple games.
16. As a player, I want the rematch to reset the board to the starting position, so that each new game starts fresh.
17. As a player, I want the rematch to reset both players' ready states to false, so that I must consciously confirm I am ready to play again.
18. As a player, I want to switch between Light, Dark, and System theme modes, so that the app matches my visual preference.
19. As a player, I want the app to respect my operating system's color scheme preference when System mode is selected, so that the app adapts automatically to my environment.
20. As a player, I want my theme preference to persist across page reloads and browser sessions, so that I do not have to reselect my theme every time.
21. As a player, I want smooth visual transitions when switching between theme modes, so that the change feels polished rather than jarring.
22. As a player who plays in a dark environment, I want a proper dark mode with dark board squares, dark card backgrounds, and readable text, so that the game is comfortable to play at night.
23. As a player, I want the theme dropdown to explicitly show all three options (Light, Dark, System), so that I can clearly see and select my current mode.
24. As a player, I want the board to adapt to dark mode with appropriately colored squares and piece styling, so that the game board remains clear and readable in dark mode.
25. As a player, I want all UI elements (lobby, game view, side panel, chat, buttons, badges) to have proper dark mode variants, so that the entire application looks consistent in dark mode.
26. As a player, I want hover, focus, and disabled states to have dark mode variants, so that interactive elements remain clear in dark mode.
27. As a host, I want to see a "Kick" button next to my opponent's name in the side panel, so that I can easily find and use the kick action.
28. As a host, I want the "Kick" button to only appear when I am the host (playerA), so that I cannot kick when I am not the room creator.
29. As a host, I want the "Kick" button to only appear when there is an opponent in the room (playerB is not null), so that it does not appear when waiting for a second player.
30. As a player viewing the game-over state, I want to see the countdown timer prominently, so that I am aware of the auto-rematch deadline.
31. As a player, I want the countdown timer to stop once I have clicked "Rematch" or "Back to Lobby", so that the timer no longer counts down after I have taken action.
32. As a player, I want the "Rematch" button to be disabled for a player who has already entered the rematch state (or whose opponent has left), so that I cannot accidentally trigger it twice.
33. As a player, I want the countdown timer to be visible in both the pre-game waiting state and the game-over state, so that I always know when a new game will start automatically.
34. As a player reconnecting to a room, I want the kick and rematch logic to work correctly after reconnection, so that my session is not broken by network issues.
35. As a developer, I want the room lifecycle logic (kick, rematch, cleanup) to be encapsulated in a testable server module, so that it can be verified in isolation.
36. As a developer, I want the theme system to be encapsulated in a frontend composable, so that it can be reused across components without duplication.
37. As a player, I want the dark mode to work correctly on all screen sizes, so that the experience is consistent on mobile and desktop.

## Implementation Decisions

### Module: Room Lifecycle (server)

A new module (or extension of the existing `rooms.ts` module) that handles room lifecycle transitions beyond the basic create/join/start flow. This module exposes:

- `kickPlayer(roomId: string, kickerId: string): Room` — validates that the kicker is playerA (host), resets the room to `waiting`, clears game state, returns the updated room.
- `enterRematchState(roomId: string, clientId: string): { room: Room; bothReady: boolean }` — marks the client as having entered the rematch state. When both players have entered, resets the room to `waiting` with fresh state.
- `leaveRoom(roomId: string, clientId: string): Room | null` — handles a player leaving the room. If the host leaves, returns null (room deleted). If playerB leaves, returns the room with playerB = null.

The module operates on the existing `Room` type and `rooms` Map. No schema changes are needed for the `Room` type — the existing fields (`status`, `playerA`, `playerB`, `playerAReady`, `playerBReady`, `gameState`, `colors`) are sufficient.

### Module: WebSocket Kick/Rematch Handlers (server)

WebSocket message handlers in the server entry point that:

- Accept `kickPlayer` action from the host, call the room lifecycle module, broadcast `roomUpdate` to the remaining player, send `kicked` message to the kicked player, and broadcast `lobbyUpdate` to the lobby.
- Accept `rematch` action, call the room lifecycle module to track rematch state, and reset the room when both players have accepted.
- Accept `leaveRoom` action (already exists), extended to handle room cleanup (delete if host leaves).

### Module: useTheme (frontend composable)

A VueUse-style composable that:

- Reads `localStorage("theme")` for the persisted preference (values: `"light"`, `"dark"`, `"system"`).
- Falls back to `"system"` if no stored value exists.
- Uses `matchMedia("(prefers-color-scheme: dark)")` to detect the system preference when in system mode.
- Applies the `dark` class to the `<html>` element.
- Listens for system preference changes (via `matchMedia` listener) and updates the class in real time.
- Exposes `theme` (ref), `setTheme(mode: "light" | "dark" | "system")`, and `toggleTheme()` (cycles through modes).

### Module: Theme Dropdown Component (frontend)

A small reusable component that renders a `<select>` dropdown with three options: Light, Dark, System. It binds to the `useTheme` composable and calls `setTheme` on change. This component is placed in the Game.vue header area and the Lobby.vue header area.

### Module: Game Over UI (frontend)

Extensions to `Game.vue` and `SidePanel.vue` to handle the game-over and rematch flow:

- `Game.vue` tracks `rematchAcceptedA` and `rematchAcceptedB` booleans (derived from server `roomUpdate` or separate `rematchState` messages).
- `Game.vue` handles a new `rematchCountdown` message from the server (or manages countdown client-side synced to server time).
- `SidePanel.vue` in game-over mode shows: the countdown timer, "Rematch" button, "Back to Lobby" button.
- `SidePanel.vue` in pre-game mode (post-rematch) shows the normal player list with ready status.
- `Game.vue` handles a new `rematchAccepted` message type from the server.

### WebSocket Protocol Extensions

New message types:
- `kicked`: sent to the kicked player, contains `reason` string.
- `rematchState`: sent to both players, contains `{ acceptedA: boolean; acceptedB: boolean; countdown: number }`.
- `rematchAccepted`: sent when a player clicks rematch, contains `clientId`.

New action types:
- `kickPlayer`: action sent by host, contains `roomId`.
- `rematch`: action sent by either player, contains `roomId`.

### Tailwind Configuration

Enable `darkMode: 'class'` in `tailwind.config.ts`. This allows the `dark:` prefix to work with the manually applied `dark` class on `<html>`.

### CSS Transitions

Add a global CSS transition rule for theme changes: `transition-colors duration-300` on root elements, or a global `* { transition: background-color 0.3s, color 0.3s, border-color 0.3s; }` rule.

## Testing Decisions

### Server Room Lifecycle Tests

Test the `kickPlayer`, `enterRematchState`, and `leaveRoom` functions in isolation. Test:
- Kick by host succeeds, room resets to `waiting`, `playerB` = `null`, ready states reset, game state cleared.
- Kick by non-host (playerB) is rejected with an error.
- Kick when playerB is null is rejected.
- Rematch: first player enters state, room stays `finished`. Second player enters state, room resets to `waiting`.
- Rematch: first player enters state, second player leaves to lobby, first player can still rematch (room resets with only themselves).
- Leave: host leaves → room is deleted. PlayerB leaves → room stays with host.
- Color randomization on rematch: verify 50/50 distribution over multiple calls.

Prior art: `rooms.test.ts` already tests `createRoom`, `joinRoom`, `toggleReady`, `startGame`. The new tests follow the same pattern.

### WebSocket Handler Tests

Test the kick and rematch WebSocket message handlers. Test:
- Kick message triggers correct server behavior and broadcasts.
- Rematch message triggers correct server behavior and broadcasts.
- Messages from non-players are rejected.

Prior art: `ws.test.ts` tests existing WebSocket actions. The new tests follow the same pattern.

### useTheme Composable Tests

Test the composable in isolation (Vitest, `@vue/test-utils`). Test:
- Default value is `"system"`.
- `setTheme("dark")` applies the `dark` class and stores in localStorage.
- `setTheme("light")` removes the `dark` class and stores in localStorage.
- `setTheme("system")` applies the `dark` class if the system prefers dark.
- System preference changes are reflected in real time.
- Stored preference is read on initialization.

Prior art: `useBoard.vitest.ts`, `useSound.vitest.ts`, `useWebSocket.vitest.ts` are existing composable tests.

### SidePanel Tests

Test the SidePanel component with game-over and rematch states. Test:
- Game-over mode renders countdown timer, rematch button, lobby button.
- Rematch button emits `rematch` event.
- Lobby button emits `backToLobby` event.
- Pre-game mode after rematch shows player list with ready status.

Prior art: `SidePanel.vitest.ts` already tests pre-game and in-game modes.

### Integration Tests

Test the full kick and rematch flow end-to-end with two simulated WebSocket clients. Test:
- Host creates room, player joins, game starts, game ends, host kicks → room resets, new player joins, game starts again.
- Host creates room, player joins, game starts, game ends, both click rematch → room resets, both ready, game starts with new colors.
- Host creates room, player joins, game starts, game ends, one clicks lobby → that player leaves, remaining player clicks rematch → room resets.

Prior art: `index.test.ts` tests WebSocket server behavior with Bun's test WebSocket client.

## Out of Scope

- **Player report/block system.** Kicking is a one-time action per game. There is no persistent block list or report mechanism.
- **Spectator mode.** Spectators cannot watch games in progress or join rooms they are not players in.
- **Theme presets beyond light/dark/system.** No additional themes (e.g., sepia, high contrast).
- **Per-piece dark mode styling.** Pieces use Unicode characters and color classes that adapt automatically to the board's background. No per-piece dark mode logic is needed.
- **Server-side theme storage.** Theme preference is client-side only (localStorage). The server does not track or store theme preferences.
- **Animated board transitions during theme changes.** Only color transitions are animated, not board layout or piece movement.
- **Rematch countdown for the pre-game waiting state.** The countdown timer only appears after a game ends. The pre-game waiting state (before either player is ready) has no countdown.
- **Kick cooldown or rate limiting.** The host can kick at any time without rate limits.
- **Automatic room deletion after inactivity.** Rooms are only deleted when the host leaves. Empty rooms (host only) persist indefinitely until the host leaves.

## Further Notes

- The existing `Room` type already has all the fields needed for kick and rematch functionality. No type schema changes are required.
- The countdown timer can be managed client-side with server-synced timestamps, or server-pushed periodically. Client-side with server time sync is simpler and sufficient for a single-room scenario.
- The `rematchState` tracking (whether each player has accepted) can be stored on the `Room` object using new boolean fields (`rematchAcceptedA`, `rematchAcceptedB`), or managed via separate server-side state. Storing on the Room object is simpler and keeps the state co-located with the room.
- The `useTheme` composable should follow the existing composable patterns in the codebase (e.g., `useBoard.ts`, `useSound.ts`).
- Theme changes should not affect the board's piece Unicode characters — only the board square colors and UI chrome colors need dark variants.
