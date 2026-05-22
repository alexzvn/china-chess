import type { Room } from "./rooms"
import type { Board, Position, GameState } from "./game/engine"

export type ServerMessage =
  | { type: "connected"; clientId: string }
  | { type: "roomCreated"; roomId: string }
  | { type: "roomUpdate"; players: RoomPlayer[]; roomStatus: Room["status"]; spectators?: string[] }
  | { type: "spectatorUpdate"; spectators: string[] }
  | { type: "lobbyUpdate"; rooms: LobbyRoom[] }
  | { type: "gameStart"; yourColor: "red" | "black"; roomId: string; opponentId: string }
  | { type: "boardUpdate"; board: Board; turn: "red" | "black"; moveCount: number; lastMove?: { from: Position; to: Position }; inCheck: boolean }
  | { type: "gameEnd"; result: "checkmate" | "stalemate" | "resign" | "draw"; winnerColor: "red" | "black" | null; reason: string; expiresAt: number }
  | { type: "error"; message: string }
  | { type: "kicked"; reason: string }
  | { type: "chat"; message: ChatMessage }
  | { type: "drawOffered"; fromClientId: string }
  | { type: "drawDeclined" }
  | { type: "rematchState"; acceptedA: boolean; acceptedB: boolean }
  | { type: "opponentReconnected" }
  | { type: "roomReclaimed"; role: "playerA" | "playerB"; roomId: string }
  | { type: "pong" }

export interface RoomPlayer {
  clientId: string
  ready: boolean
  name: string
}

export interface LobbyRoom {
  roomId: string
  playerA: string
  playerB: string | null
  status: Room["status"]
}

export interface ChatMessage {
  sender: string
  senderName: string
  text: string
  timestamp: number
  color: "red" | "black"
}
