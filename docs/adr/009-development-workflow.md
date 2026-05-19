# ADR-009: Development Workflow

**Status:** Accepted
**Date:** 2025-01-19

## Context

The project has both a frontend (Vue + Vite) and a backend (Bun + Elysia). The development workflow must support independent hot reload for both sides while keeping the setup simple.

## Decision

- Two separate terminals during development:
  - Terminal 1: `vite` (frontend hot reload on port 5173)
  - Terminal 2: `bun run src/server/index.ts` (backend on port 3000)
- Iterative development: each cycle builds a small feature across both frontend and server simultaneously.
- Feature branches for git workflow (`feat/server`, `feat/vue`, `feat/engine`, etc.) merged into `main`.
- Production: `vite build` → `bun run src/server/index.ts` (single process, single port).
- Strict TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`) across all code.
- Tailwind CSS: configured via `tailwind.config.ts` in the Vue app root, with `@tailwind` directives in the main CSS entry.

## Consequences

- Independent hot reload for frontend and backend.
- No `concurrently` or process manager needed during development.
- Iterative cycles keep each change small and testable.
- Feature branches organize work before merging.
- Strict TypeScript catches errors early.
