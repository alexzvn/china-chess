import type { ServerMessage } from "../protocol"
import type { Room } from "../rooms"
import type { Position } from "../game/engine"

export interface RoomActionContext {
  roomId: string
  clientId: string
  room: Room
  from?: Position
  to?: Position
  send: (clientId: string, message: ServerMessage) => void
  broadcastLobby: () => void
}

export interface NoRoomActionContext {
  clientId: string
  send: (clientId: string, message: ServerMessage) => void
  broadcastLobby: () => void
}

export type ActionResult =
  | { kind: "error"; message: string }
  | { kind: "ok"; notifications: Notification[] }

export type Notification =
  | { kind: "send"; clientId: string; message: ServerMessage }
  | { kind: "broadcastLobby" }
