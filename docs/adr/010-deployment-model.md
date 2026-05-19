# ADR-010: Deployment Model

**Status:** Accepted
**Date:** 2025-01-19

## Context

The application needs a simple deployment model that works for both development and production.

## Decision

- Single process deployment: Bun serves both the compiled Vue static files and the WebSocket server on one port.
- Vite builds to `public/`, Elysia's static plugin serves `public/`.
- WebSocket upgrades handled on the same port via the `Upgrade: websocket` header.
- No reverse proxy (Nginx/Caddy), no Docker, no CI/CD pipeline for v1.
- No horizontal scaling — single process, single port.
- Deploy to any host that can run Bun.

## Consequences

- Simplest possible deployment: one command, one port.
- No CORS configuration needed in production (same origin).
- No infrastructure complexity — no databases, no Redis, no message queues.
- Games are lost on restart (acceptable for v1).
- Scaling or persistence can be added later if the project grows.
