# ADR-001: Tech Stack Selection

**Status:** Accepted
**Date:** 2025-01-19

## Context

We are building a full-stack Chinese Chess (象棋) online multiplayer game. The project needs a backend server, a frontend UI, and a game rule engine. The project already uses Bun as the runtime.

## Decision

- **Runtime:** Bun
- **Backend:** ElysiaJS (TypeScript-first, Bun-native, built-in WebSocket support)
- **Frontend:** Vue 3 + Vite (Composition API, `<script setup>`, plain ref/computed, no Pinia)
- **Styling:** Tailwind CSS (utility-first, no custom CSS files)
- **Composables:** VueUse/core (reusable Vue composables)
- **Package Manager:** Bun only (`bun install`, `bun run`, `bun test`)
- **Routing:** Vue Router in history mode

## Consequences

- Single package, single lockfile, one dependency graph.
- Vite handles frontend hot reload independently of the server.
- Elysia handles both HTTP (static file serving) and WebSocket on a single port.
- No Pinia — state management uses Vue's built-in `ref`/`computed`/`watch`.
- Tailwind CSS handles all styling via utility classes.
- VueUse provides composables for common patterns (media queries, window size, mouse tracking, local storage, etc.).
- All testing uses `bun test` (server/engine) and Vitest (Vue).
