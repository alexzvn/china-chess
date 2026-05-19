# ADR-005: Room Management Model

**Status:** Accepted
**Date:** 2025-01-19

## Context

Players need to find and join games. The room model must support lobby browsing, room creation, joining, and game state transitions.

## Decision

- Room state: `{ roomId, createdAt, playerA, playerB, status }`.
- `playerA`: first player to join (nanoid client ID).
- `playerB`: second player to join (nanoid client ID).
- Status transitions: `waiting` → `playing` → `finished`.
- Room ID: nanoid(7), URL-safe, short enough for sharing.
- Lobby: list of rooms with `status === 'waiting'`.
- Room creation: first player becomes `playerA`, room enters `waiting`.
- Room joining: second player becomes `playerB`, room stays `waiting`.
- Game start: both players click "Start Game", server randomly assigns Red/Black, room enters `playing`.
- No password protection — rooms are joinable by anyone with the room ID.
- No player names — players identified by color (Red/Black) only.

## Consequences

- Simple room lifecycle with three states.
- Color assignment happens at game start, not at join time.
- Room IDs are short and shareable via URL (`/room/:id`).
- No account system — fully anonymous play.
- Any player with a room ID can join an open room.
