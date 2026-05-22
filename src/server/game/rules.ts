import type { Board } from "./engine"

// Pieces that can force checkmate (attacking pieces)
const ATTACKING_PIECES = new Set(["車", "馬", "炮", "砲", "兵", "卒"])

/**
 * Check if the current position has insufficient material to force checkmate.
 * In Chinese Chess, draw by insufficient material when:
 * - Only generals remain (no attacking pieces)
 * - One side has only 士 and/or 象 besides the general
 */
export function isInsufficientMaterial(board: Board): boolean {
  let hasAttackingPiece = false
  
  for (let r = 0; r < 10; r++) {
    for (let f = 0; f < 9; f++) {
      const piece = board[r]![f]
      if (!piece) continue
      
      const type = piece.slice(1)
      // Skip generals, advisors, and elephants
      if (type === "帥" || type === "將" || type === "士" || type === "象") continue
      
      // If any other piece exists → material is sufficient
      if (ATTACKING_PIECES.has(type)) {
        hasAttackingPiece = true
      }
    }
  }
  
  return !hasAttackingPiece
}

/**
 * Serialize a board position to a string for comparison.
 */
function serializeBoard(board: Board): string {
  return board.map(row => {
    return row.map(cell => cell ?? "0").join("")
  }).join("/")
}

/**
 * Track position history during a game.
 * A history is an array of serialized board positions.
 */

/**
 * Check if the given position history indicates perpetual chase.
 * In Chinese Chess: if the same position repeats 3 times, it's a draw.
 */
export function isPerpetualChase(history: string[]): boolean {
  if (history.length < 5) return false
  
  const lastPos = history[history.length - 1]!
  let count = 0
  
  for (const pos of history) {
    if (pos === lastPos) count++
  }
  
  return count >= 3
}

/**
 * Get the current position as a serialized string for history tracking.
 */
export function getPositionKey(board: Board): string {
  return serializeBoard(board)
}
