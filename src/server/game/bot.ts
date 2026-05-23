import type { Board, Position } from "./engine"
import { getLegalMoves } from "./engine"

// Piece values for evaluation
const PIECE_VALUES: Record<string, number> = {
  車: 900,
  馬: 400,
  炮: 450,
  砲: 450,
  士: 200,
  象: 200,
  帥: 10000,
  將: 10000,
  兵: 100,
  卒: 100,
}

// Capture-value bonus for move ordering — captures of high-value pieces first
const CAPTURE_VALUES: Record<string, number> = {
  車: 900,
  馬: 400,
  炮: 450,
  砲: 450,
  士: 200,
  象: 200,
  帥: 10000,
  將: 10000,
  兵: 100,
  卒: 100,
  default: 0,
}

// Position bonus tables (simplified — higher values for better positions)
function positionBonus(piece: string, rank: number, file: number): number {
  const type = piece.slice(1)
  const isRed = piece.startsWith("r")

  // Pawns get bonus for advancing
  if (type === "兵" || type === "卒") {
    const advancement = isRed ? 9 - rank : rank
    // Bonus increases as pawns cross the river (rank 5 is river for red, rank 4 for black)
    if (isRed && rank <= 4) return advancement * 15 // Crossed river
    if (!isRed && rank >= 5) return advancement * 15
    return advancement * 5
  }

  // Horses are better in the center
  if (type === "馬") {
    const centerDist = Math.abs(file - 4)
    return (4 - centerDist) * 10
  }

  // Cannons are better with more pieces on the board (early game)
  if (type === "炮" || type === "砲") {
    return 20
  }

  // Chariots are best on open files
  if (type === "車") {
    return 15
  }

  return 0
}

/** Evaluate a board position from the perspective of `color` */
export function evaluate(board: Board, color: "red" | "black"): number {
  let score = 0

  for (let r = 0; r < 10; r++) {
    for (let f = 0; f < 9; f++) {
      const piece = board[r]![f]
      if (!piece) continue

      const type = piece.slice(1)
      const value = PIECE_VALUES[type] ?? 0
      const bonus = positionBonus(piece, r, f)
      const totalValue = value + bonus

      if (piece.startsWith(color === "red" ? "r" : "b")) {
        score += totalValue
      } else {
        score -= totalValue
      }
    }
  }

  return score
}

export type Difficulty = "beginner" | "easy" | "medium" | "hard" | "expert"

interface DifficultyConfig {
  maxDepth: number
  randomChance: number
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  beginner: { maxDepth: 1, randomChance: 0.3 },
  easy: { maxDepth: 2, randomChance: 0.2 },
  medium: { maxDepth: 3, randomChance: 0.1 },
  hard: { maxDepth: 4, randomChance: 0 },
  expert: { maxDepth: 4, randomChance: 0 },
}

// Max search time per move in ms
const MAX_SEARCH_TIME_MS = 2000

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row])
}

/** Get all legal moves for a color */
function getAllMoves(board: Board, color: "red" | "black"): Array<{ from: Position; to: Position }> {
  const prefix = color === "red" ? "r" : "b"
  const moves: Array<{ from: Position; to: Position }> = []

  for (let r = 0; r < 10; r++) {
    for (let f = 0; f < 9; f++) {
      const piece = board[r]![f]
      if (!piece || !piece.startsWith(prefix)) continue

      const from: Position = { rank: r, file: f }
      const legalMoves = getLegalMoves(board, from)

      for (const to of legalMoves) {
        moves.push({ from, to })
      }
    }
  }

  return moves
}

function applyMove(board: Board, from: Position, to: Position): Board {
  const newBoard = cloneBoard(board)
  newBoard[to.rank]![to.file] = newBoard[from.rank]![from.file] ?? null
  newBoard[from.rank]![from.file] = null
  return newBoard
}

/** Order moves so captures (high-value captures first) come first for alpha-beta */
function orderMoves(board: Board, moves: Array<{ from: Position; to: Position }>): Array<{ from: Position; to: Position }> {
  return [...moves].sort((a, b) => {
    const capturedA = board[a.to.rank]![a.to.file]
    const capturedB = board[b.to.rank]![b.to.file]
    const valA = capturedA ? (CAPTURE_VALUES[capturedA.slice(1)] ?? 0) : 0
    const valB = capturedB ? (CAPTURE_VALUES[capturedB.slice(1)] ?? 0) : 0
    return valB - valA // Highest value capture first
  })
}

/**
 * Minimax with alpha-beta pruning and move ordering.
 * Stops searching when deadline is exceeded and returns a "timeout sentinel".
 */
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  color: "red" | "black",
  deadline: number,
): number {
  if (Date.now() > deadline) {
    return maximizing ? -Infinity : Infinity
  }

  if (depth === 0) {
    return evaluate(board, color)
  }

  const currentColor = maximizing ? color : (color === "red" ? "black" : "red")
  const rawMoves = getAllMoves(board, currentColor)

  if (rawMoves.length === 0) {
    // No moves = loss (checkmate or stalemate)
    return maximizing ? -99999 : 99999
  }

  // Move ordering: captures first for effective alpha-beta pruning
  const moves = orderMoves(board, rawMoves)

  if (maximizing) {
    let maxEval = -Infinity
    for (const move of moves) {
      const newBoard = applyMove(board, move.from, move.to)
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, color, deadline)
      if (evalScore === -Infinity) return -Infinity // timed out
      maxEval = Math.max(maxEval, evalScore)
      alpha = Math.max(alpha, evalScore)
      if (beta <= alpha) break // Beta cutoff
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const move of moves) {
      const newBoard = applyMove(board, move.from, move.to)
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, color, deadline)
      if (evalScore === Infinity) return Infinity // timed out
      minEval = Math.min(minEval, evalScore)
      beta = Math.min(beta, evalScore)
      if (beta <= alpha) break // Alpha cutoff
    }
    return minEval
  }
}

export class BotEngine {
  private difficulty: Difficulty
  private config: DifficultyConfig

  constructor(difficulty: Difficulty = "medium") {
    this.difficulty = difficulty
    this.config = DIFFICULTY_CONFIGS[difficulty]
  }

  /** Find the best move for the given color */
  findBestMove(board: Board, color: "red" | "black"): { from: Position; to: Position } | null {
    const moves = getAllMoves(board, color)

    if (moves.length === 0) return null

    // Random move chance
    if (Math.random() < this.config.randomChance) {
      const randomIndex = Math.floor(Math.random() * moves.length)
      return moves[randomIndex]!
    }

    const deadline = Date.now() + MAX_SEARCH_TIME_MS

    // Iterative deepening + alpha-beta with move ordering
    const orderedMoves = orderMoves(board, moves)
    let bestMove = orderedMoves[0]!
    let bestScore = -Infinity

    // Start with depth 1 and go deeper until time runs out
    for (let depth = 1; depth <= this.config.maxDepth; depth++) {
      let currentBestScore = -Infinity
      let currentBestMove = orderedMoves[0]!
      let completed = true

      for (const move of orderedMoves) {
        if (Date.now() > deadline) {
          completed = false
          break
        }

        const newBoard = applyMove(board, move.from, move.to)
        const score = minimax(
          newBoard,
          depth - 1,
          -Infinity,
          Infinity,
          false,
          color,
          deadline,
        )

        if (score === -Infinity || score === Infinity) {
          // Timed out during this search
          completed = false
          break
        }

        if (score > currentBestScore) {
          currentBestScore = score
          currentBestMove = move
        }
      }

      if (completed) {
        bestScore = currentBestScore
        bestMove = currentBestMove
      }

      // If we ran out of time, use the last completed depth's result
      if (!completed) break
    }

    return bestMove
  }

  /** Get the difficulty level */
  getDifficulty(): Difficulty {
    return this.difficulty
  }
}

/** Create a bot with the given difficulty */
export function createBot(difficulty: Difficulty): BotEngine {
  return new BotEngine(difficulty)
}