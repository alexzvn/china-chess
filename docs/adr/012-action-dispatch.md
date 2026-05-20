# ADR-012: WebSocket Action Dispatch Pattern

**Status:** Accepted
**Date:** 2025-01-20

## Context

The WebSocket `message` handler in `src/server/index.ts` contained a ~450-line cascade of `if (action === ...)` blocks. Each block repeated the same pattern: validate room exists → check status → check player ownership → mutate state → route response → broadcast. This made it impossible to add a new action without editing the monolithic handler, and testing required crossing the full handler interface.

## Decision

- **Three-layer seam** between WebSocket transport and game logic:
  1. **Handler** — thin dispatch table (~35 lines), routes action name to adapter, processes results
  2. **Action adapters** — each handles one action, calls the Room module, builds notifications, returns `ActionResult`
  3. **Room module** (`rooms.ts`) — owns all state mutations, returns `{ room }` (or `{ room, kickedId }` for kick)
- **Result-based error handling**: adapters return `{ kind: 'ok' | 'error', notifications? }`. No throwing.
- **Two context types**: `RoomActionContext` (with `room: Room`) for room actions, `NoRoomActionContext` (no room) for `createRoom`/`joinLobby`.
- **Notification as discriminated union**: `{ kind: 'send'; clientId; message }` | `{ kind: 'broadcastLobby' }`. The handler delivers based on `kind`.
- **Protocol types** in `protocol.ts`: `ServerMessage` discriminated union for all server→client messages.
- **File organization**: adapters split by domain into `actions/room.ts`, `actions/game.ts`, `actions/phase.ts`.
- **Exceptions stay inline**: `ping`/`pong` (protocol-level), `reclaimRoom` (connection-layer mutation).

## Consequences

- **Adding an action** requires: adding a type to `ServerMessage`, writing an adapter in the appropriate `actions/` file, and adding an entry to the dispatch table in `actions/index.ts`. The handler is untouched.
- **Testing** each adapter crosses a small interface (context + room state) rather than the full WebSocket handler.
- **Locality**: each action's validation, mutation, and notification logic is in one file.
- **The handler is thin**: ~35 lines of routing and result processing. It doesn't contain game logic.
- **The Room module is pure**: it only mutates state. It doesn't know about messages, clients, or the network.
- **Adapters own protocol knowledge**: they know which messages to send based on room state changes. This is the seam between state machine and messaging.
- **`reclaimRoom` stays inline** because it mutates the `clientConnections` map, which is connection-layer state that game actions don't touch. This is a real category — connection actions vs. game actions.

## Trade-offs considered

- **Throw vs. result**: throwing gives compile-time enforcement but requires try/catch in a hot path. Result-based is more honest — the interface exposes the error mode.
- **Room module returns notifications vs. adapters build them**: returning notifications from the Room module couples the state machine to the protocol. Keeping it in adapters maintains a clean seam.
- **Single actions.ts vs. split files**: 14 adapters in one file is 210 lines and hard to navigate. Splitting by domain (`room`, `game`, `phase`) makes each file ~15-40 lines.
- **Pre-validate room in handler vs. adapters check**: pre-validation eliminates N × "room is undefined" checks but requires per-action context building. The cost is one-time in the handler, not per-action.
