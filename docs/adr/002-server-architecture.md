# ADR-002: Server Architecture

**Status:** Accepted
**Date:** 2025-01-19

## Context

The server must handle WebSocket connections for real-time multiplayer, manage game rooms, validate moves, and serve the compiled Vue frontend as static files.

## Decision

- ElysiaJS as the HTTP and WebSocket framework.
- Single port: both static files and WebSocket on the same port.
- WebSocket endpoint at `/ws`.
- Static files served from `public/` (Vite build output).
- CORS enabled only in development mode (Vite on port 5173, Bun on port 3000).
- Ping/pong heartbeat via Elysia's built-in WebSocket support (30s ping, 60s pong timeout).
- In-memory state only — no database, no Redis.
- Structured JSON logging for room lifecycle, player actions, and chat.
- Minimal environment variables: `PORT`, `NODE_ENV`.

## Consequences

- Simple deployment: one process, one port.
- No CORS configuration needed in production.
- Grace period for reconnection (60s) managed in-memory.
- Games are lost on server restart (acceptable for v1).
- Elysia's TypeBox validation provides runtime type safety for WebSocket messages.
