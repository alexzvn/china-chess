# ADR-004: WebSocket Protocol Design

**Status:** Accepted
**Date:** 2025-01-19

## Context

The frontend and backend communicate over WebSocket for real-time game updates. The protocol must be simple, debuggable, and extensible.

## Decision

- JSON-based, action-oriented messages.
- Anonymous connections: server generates `clientId` (nanoid 7 chars) on WebSocket open.
- First client message determines routing: `joinLobby` or `joinRoom`.
- Client → Server messages: `move`, `resign`, `drawOffer`, `drawAccept`, `drawDecline`, `chat`.
- Server → Client messages: `boardUpdate`, `gameStart`, `gameEnd`, `error`, `roomJoined`, `lobbyUpdate`.
- Error handling: WebSocket messages for game-level errors (invalid move, room not found), HTTP status codes for infrastructure errors (500, 429).
- Auto-reconnect: client reconnects every 3 seconds on disconnect.
- Grace period: 60 seconds for reconnection after disconnect; forfeit on timeout.

## Consequences

- Simple to debug: messages are human-readable JSON.
- No authentication layer needed for v1.
- Client identifies itself by server-generated `clientId`.
- Room ID (nanoid 7 chars) lives in the URL and WebSocket message payloads.
- Reconnection is automatic but requires the client to re-announce its intent (join lobby or room).
