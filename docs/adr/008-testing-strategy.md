# ADR-008: Testing Strategy

**Status:** Accepted
**Date:** 2025-01-19

## Context

The project has three major testable areas: the game engine (rule logic), the WebSocket server (room management and message routing), and the Vue frontend (UI and user interaction).

## Decision

- **Engine unit tests:** `bun test` — test piece movement rules, check detection, checkmate detection, stalemate detection, move validation (no self-check), legal move enumeration.
- **WebSocket integration tests:** `bun test` — test room creation, joining, game state transitions, move broadcasting, disconnect handling, reconnection grace period, resign/draw workflows.
- **Vue E2E tests:** Vitest — test lobby rendering, room navigation, board rendering, piece selection, legal move highlighting, chat display, game over display, responsive layout, reconnection UI.
- All tests are independently verifiable and test external behavior, not implementation details.
- No rate limiting tests (rate limiting is not implemented).
- No persistence tests (in-memory only).

## Consequences

- Engine tests can be run in isolation with `bun test` — no server or frontend needed.
- Integration tests verify the full WebSocket flow without a real frontend.
- E2E tests verify the complete user flow end-to-end.
- `bun test` provides native TypeScript support and fast execution.
- Vitest provides Vue-specific testing utilities for components.
