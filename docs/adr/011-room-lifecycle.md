# ADR-011: Room Lifecycle — Kick and Rematch

**Status:** Accepted
**Date:** 2025-01-19

## Context

The room model (ADR-005) defines three states: `waiting` → `playing` → `finished`. After a game ends, the room is `finished` and disappears from the lobby. Players must leave to the lobby and create or rejoin a room to play again. The host has no way to reset the room without both players leaving.

## Decision

- **Kick:** The host (`playerA`) can kick `playerB`. The room resets to `waiting`: `playerB` becomes `null`, ready states reset, game state and colors are cleared. The room stays in the lobby for new players. The kicked player receives a `kicked` message and is sent to the lobby.
- **Rematch:** After a game ends, both players see a countdown timer with "Rematch" and "Back to Lobby" options. The room resets to `waiting` only when both players have entered the rematch state (either by clicking "Rematch" or by the countdown expiring). Both players return to pre-game mode and must toggle ready again. Colors are re-randomized.
- **Room cleanup:** If the host (`playerA`) leaves the room, the room is deleted entirely. If only `playerB` leaves, the room stays with the host only.
- **Status transitions:** `playing` → `finished` → `waiting` (rematch or kick). The `finished` state is now transient — it exists only between game end and the rematch decision.

## Consequences

- The room lifecycle has four states: `waiting`, `playing`, `finished`, `waiting` (via rematch/kick). The `finished` state is ephemeral.
- A new player can join a room that just had a game end (if the host clicks rematch while the opponent left).
- The host has unilateral power to kick — no appeal mechanism.
- Rematch requires mutual consent, preventing one player from being forced into an unwanted game.
- The countdown timer introduces a timing dependency — both players must act within the timeout window.
