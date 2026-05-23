/**
 * Bot worker — runs findBestMove in a separate thread so the server event loop stays responsive.
 * Communicates via structured clone serialization (JSON).
 */
import { BotEngine } from "./bot"
import type { Board } from "./engine"

interface WorkerRequest {
  id: number
  roomId: string
  board: Board
  color: "red" | "black"
  difficulty: import("./bot").Difficulty
}

interface WorkerResponse {
  id: number
  roomId: string
  board: Board
  color: "red" | "black"
  from: { rank: number; file: number } | null
  to: { rank: number; file: number } | null
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, roomId, board, color, difficulty } = e.data

  const engine = new BotEngine(difficulty)
  const move = engine.findBestMove(board as Board, color)

  const response: WorkerResponse = {
    id,
    roomId,
    board,
    color,
    from: move?.from ?? null,
    to: move?.to ?? null,
  }

  self.postMessage(response)
}