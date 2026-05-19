# ADR-003: Game Engine Architecture

**Status:** Accepted
**Date:** 2025-01-19

## Context

The Chinese Chess game engine must validate all piece movements, detect check and checkmate, and enforce stalemate rules. It needs to be testable in isolation from the server and frontend.

## Decision

- Pure TypeScript module with zero framework dependencies (no Elysia, no Vue imports).
- Board representation: 2D array `board[rank][file]` (10 × 9), each cell is `null` or a Unicode piece character.
- Coordinates: 0-indexed `{ rank: number, file: number }`.
- Per-piece validation functions: separate `isValidMove(pieceType, from, to, board)` for each of the 7 piece types (車, 馬, 炮, 士, 象, 將/帥, 兵/卒).
- Check detection: simulate the move, then scan the entire board for enemy attacks on the king.
- Checkmate/stalemate detection: iterate all pieces of the current turn's color and check if any has legal moves.
- Move history: full `Move[]` array recorded per game.
- Minimal rules: piece movement, check, checkmate, stalemate (loss). No perpetual check/repetition detection.

## Consequences

- Engine can be unit-tested independently with `bun test`.
- Board size (90 cells) makes brute-force check detection fast enough — no incremental attack maps or bitboards needed.
- Per-piece validation functions are readable and maintainable.
- Framework-agnostic engine can be reused or swapped without touching server or frontend code.
