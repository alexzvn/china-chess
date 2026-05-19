# ADR-006: Frontend Architecture

**Status:** Accepted
**Date:** 2025-01-19

## Context

The Vue frontend must render the Chinese Chess board, handle user interaction, display the lobby, manage chat, and provide visual feedback for game events.

## Decision

- Vue 3 + Vite with Composition API (`<script setup>`).
- No Pinia — state management via `ref`/`computed`/`watch`.
- Vue Router in history mode (`/` for lobby, `/room/:id` for game).
- Tailwind CSS for styling — utility-first approach, no custom CSS files.
- VueUse/core for reusable composables (`useLocalStorage`, `useMediaQuery`, `useWindowSize`, `useMouse`, `useElementSize`, `useThrottleFn`, etc.).
- Components: `Board.vue`, `Piece.vue`, `RoomCard.vue`, `ChatPanel.vue`, `PlayerInfo.vue`, `Lobby.vue`, `Game.vue`.
- Responsive board: scales to fit any viewport using Tailwind responsive utilities and CSS `vmin`/`vw` units.
- Adaptive layout: chat alongside board on desktop, below on mobile.
- Visual feedback: selected piece highlight, legal move dots (circles for empty, rings for capture), red glow on king for check, active player area highlight.
- Sound effects via Web Audio API: piece placement click, capture thud, check warning tone.
- Game over: status bar below board with result and "Back to Lobby" button.
- No move list sidebar, no last-move highlight, no chat moderation.

## Consequences

- Lightweight frontend with Tailwind CSS and VueUse as the only UI dependencies.
- Board renders correctly on any screen size.
- Visual cues make the game approachable without text instructions.
- Web Audio API avoids external audio assets.
- Simple component structure with 7 focused components.
