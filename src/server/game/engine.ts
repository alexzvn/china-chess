export interface Position {
  rank: number // 0–9 (0 = top/black side)
  file: number // 0–8
}

// Board cells: color-prefixed piece char, e.g. "r車" or "b馬", or null for empty
export type Board = (string | null)[][]

// Piece list: each entry is { color-prefixed-char, display char, color }
// Red set: 車馬炮士象帥兵
// Black set: 車馬砲士象將卒

const PIECE_COLORS: Record<string, "red" | "black"> = {
  r: "red",
  b: "black",
}

function isRed(piece: string): boolean {
  return piece.startsWith("r")
}

function isBlack(piece: string): boolean {
  return piece.startsWith("b")
}

function sameColor(a: string, b: string): boolean {
  return a[0] === b[0]
}

function isOnBoard(pos: Position): boolean {
  return pos.rank >= 0 && pos.rank <= 9 && pos.file >= 0 && pos.file <= 8
}

function getPiece(board: Board, pos: Position): string | null {
  return board[pos.rank]![pos.file]!
}

/** Count pieces between two positions along a straight line (exclusive) */
function countBetween(
  board: Board,
  from: Position,
  to: Position,
): number {
  let count = 0
  if (from.rank === to.rank) {
    const minFile = Math.min(from.file, to.file)
    const maxFile = Math.max(from.file, to.file)
    for (let f = minFile + 1; f < maxFile; f++) {
      if (board[from.rank]![f]) count++
    }
  } else if (from.file === to.file) {
    const minRank = Math.min(from.rank, to.rank)
    const maxRank = Math.max(from.rank, to.rank)
    for (let r = minRank + 1; r < maxRank; r++) {
      if (board[r]![from.file]) count++
    }
  }
  return count
}

/** Check if a slide move is valid — no pieces between from and to */
function isValidSlide(board: Board, from: Position, to: Position): boolean {
  if (from.rank !== to.rank && from.file !== to.file) return false
  if (from.rank === to.rank && from.file === to.file) return false
  return countBetween(board, from, to) === 0
}

/**
 * Validate a move for a given piece type.
 * @param pieceType Color-prefixed piece, e.g. "r車", "b馬"
 */
export function isValidMove(
  pieceType: string,
  from: Position,
  to: Position,
  board: Board,
): boolean {
  if (!isOnBoard(from) || !isOnBoard(to)) return false

  const target = getPiece(board, to)
  // Can't land on own piece
  if (target && sameColor(pieceType, target)) return false

  const type = pieceType.slice(1)
  const dr = to.rank - from.rank
  const df = to.file - from.file
  const absDr = Math.abs(dr)
  const absDf = Math.abs(df)

  switch (type) {
    // 車 — slide any distance orthogonally
    case "車": {
      return isValidSlide(board, from, to)
    }

    // 馬 — L-shape (2+1), leg-block if adjacent square in first direction is occupied
    case "馬": {
      if (!((absDr === 2 && absDf === 1) || (absDr === 1 && absDf === 2))) return false
      // Leg-block check: the square in the long direction
      const legRank = from.rank + (dr === 0 ? 0 : dr > 0 ? 1 : -1)
      const legFile = from.file + (df === 0 ? 0 : df > 0 ? 1 : -1)
      // For 馬, the leg is the first step in the long direction
      // If dr=2, the leg is at from.rank + sign(dr), from.file
      // If df=2, the leg is at from.rank, from.file + sign(df)
      const legR = absDr === 2 ? from.rank + (dr > 0 ? 1 : -1) : from.rank
      const legF = absDf === 2 ? from.file + (df > 0 ? 1 : -1) : from.file
      if (board[legR]![legF]) return false
      return true
    }

    // 炮 — slides orthogonally; captures by jumping over exactly one piece (screen)
    case "炮":
    case "砲": {
      if (from.rank !== to.rank && from.file !== to.file) return false
      if (from.rank === to.rank && from.file === to.file) return false
      const between = countBetween(board, from, to)
      const isCapture = target !== null
      if (isCapture) return between === 1
      return between === 0
    }

    // 士 — one step diagonally, confined to palace
    case "士": {
      if (absDr !== 1 || absDf !== 1) return false
      const isRedPiece = isRed(pieceType)
      const palaceMinRank = isRedPiece ? 7 : 0
      const palaceMaxRank = isRedPiece ? 9 : 2
      if (to.rank < palaceMinRank || to.rank > palaceMaxRank) return false
      if (to.file < 3 || to.file > 5) return false
      return true
    }

    // 象 — two steps diagonally, eye-blocked, cannot cross river
    case "象": {
      if (absDr !== 2 || absDf !== 2) return false
      // Eye square
      const eyeR = from.rank + dr / 2
      const eyeF = from.file + df / 2
      if (board[eyeR]![eyeF]) return false
      // River restriction
      const isRedPiece = isRed(pieceType)
      if (isRedPiece && to.rank < 5) return false
      if (!isRedPiece && to.rank > 4) return false
      return true
    }

    // 將/帥 — one step orthogonally, confined to palace
    case "將":
    case "帥": {
      if (!((absDr === 1 && absDf === 0) || (absDr === 0 && absDf === 1))) return false
      const isRedPiece = isRed(pieceType)
      const palaceMinRank = isRedPiece ? 7 : 0
      const palaceMaxRank = isRedPiece ? 9 : 2
      if (to.rank < palaceMinRank || to.rank > palaceMaxRank) return false
      if (to.file < 3 || to.file > 5) return false
      return true
    }

    // 兵/卒 — forward only; after crossing river, also sideways; never backward
    case "兵":
    case "卒": {
      if (absDr + absDf !== 1) return false
      const isRedPiece = isRed(pieceType)
      const crossedRiver = isRedPiece ? from.rank <= 4 : from.rank >= 5
      // Forward direction: red moves up (rank--), black moves down (rank++)
      if (isRedPiece && dr > 0) return false // red cannot move backward (down)
      if (!isRedPiece && dr < 0) return false // black cannot move backward (up)
      // Sideways only allowed if crossed river
      if (df !== 0 && !crossedRiver) return false
      return true
    }

    default:
      return false
  }
}

export interface GameState {
  board: Board
  turn: "red" | "black"
  moveCount: number
  lastMove?: { from: Position; to: Position }
  captured?: string | null
  positionHistory?: string[]
}

/** Check if the two generals face each other on the same file */
function areGeneralsFacing(board: Board): boolean {
  const redKing = findKing(board, "red")
  const blackKing = findKing(board, "black")
  if (!redKing || !blackKing) return false
  
  // Must be on same file
  if (redKing.file !== blackKing.file) return false
  
  // Check if there are any pieces between them on that file
  const minRank = Math.min(redKing.rank, blackKing.rank)
  const maxRank = Math.max(redKing.rank, blackKing.rank)
  for (let r = minRank + 1; r < maxRank; r++) {
    if (board[r]![redKing.file]) return false // Something blocking
  }
  
  // Nothing between them → facing!
  return true
}

/** Deep-clone a board */
function cloneBoard(board: Board): Board {
  return board.map((row) => [...row])
}

/** Find the king position for a given color */
function findKing(board: Board, color: "red" | "black"): Position | null {
  const prefix = color === "red" ? "r" : "b"
  const kingChars = color === "red" ? ["帥"] : ["將"]
  for (let r = 0; r < 10; r++) {
    for (let f = 0; f < 9; f++) {
      const piece = board[r]![f]
      if (piece && kingChars.includes(piece.slice(1)) && piece.startsWith(prefix)) {
        return { rank: r, file: f }
      }
    }
  }
  return null
}

/**
 * Check if the king of the given color is in check.
 * Scans all enemy pieces to see if any can attack the king.
 */
export function isInCheck(board: Board, color: "red" | "black"): boolean {
  const kingPos = findKing(board, color)
  if (!kingPos) return false

  const enemyPrefix = color === "red" ? "b" : "r"

  // Check every enemy piece
  for (let r = 0; r < 10; r++) {
    for (let f = 0; f < 9; f++) {
      const piece = board[r]![f]
      if (!piece || !piece.startsWith(enemyPrefix)) continue
      if (isValidMove(piece, { rank: r, file: f }, kingPos, board)) {
        return true
      }
    }
  }

  return false
}

/**
 * Get all legal destination positions for a piece at `pos`.
 * Filters out moves that would leave the moving player's own king in check.
 */
export function getLegalMoves(board: Board, pos: Position): Position[] {
  const piece = getPiece(board, pos)
  if (!piece) return []

  const color = piece.startsWith("r") ? "red" : "black"
  const type = piece.slice(1)
  const results: Position[] = []

  // For sliding pieces (車, 炮), we need to check all possible destinations
  // For other pieces, we check specific offsets
  for (let r = 0; r < 10; r++) {
    for (let f = 0; f < 9; f++) {
      const to: Position = { rank: r, file: f }
      if (!isValidMove(piece, pos, to, board)) continue

      // Simulate the move
      const sim = cloneBoard(board)
      sim[r]![f] = sim[pos.rank]![pos.file] ?? null
      sim[pos.rank]![pos.file] = null

      // Check if own king would be in check
      // Also check that generals don't face each other
      if (!isInCheck(sim, color) && !areGeneralsFacing(sim)) {
        results.push(to)
      }
    }
  }

  return results
}

/**
 * Check if the given color is in checkmate.
 * In Chinese Chess: checkmate = king in check AND no legal moves for any piece.
 */
export function isCheckmate(board: Board, color: "red" | "black"): boolean {
  if (!isInCheck(board, color)) return false

  const prefix = color === "red" ? "r" : "b"
  for (let r = 0; r < 10; r++) {
    for (let f = 0; f < 9; f++) {
      const piece = board[r]![f]
      if (!piece || !piece.startsWith(prefix)) continue
      if (getLegalMoves(board, { rank: r, file: f }).length > 0) return false
    }
  }

  return true
}

/**
 * Check if the given color is in stalemate.
 * In Chinese Chess: stalemate = NOT in check BUT no legal moves for any piece.
 * Crucially, in Chinese Chess, stalemate is a LOSS for the side with no moves.
 */
export function isStalemate(board: Board, color: "red" | "black"): boolean {
  if (isInCheck(board, color)) return false

  const prefix = color === "red" ? "r" : "b"
  for (let r = 0; r < 10; r++) {
    for (let f = 0; f < 9; f++) {
      const piece = board[r]![f]
      if (!piece || !piece.startsWith(prefix)) continue
      if (getLegalMoves(board, { rank: r, file: f }).length > 0) return false
    }
  }

  return true
}

/**
 * Apply a move to the game state.
 * Validates the move, checks turn, checks self-check.
 * Returns the new GameState or null if the move is illegal.
 */
export function makeMove(
  state: GameState,
  from: Position,
  to: Position,
): GameState | null {
  const piece = getPiece(state.board, from)
  if (!piece) return null

  // Check turn
  const pieceColor = piece.startsWith("r") ? "red" : "black"
  if (pieceColor !== state.turn) return null

  // Validate the move (including self-check constraint via getLegalMoves)
  const legalMoves = getLegalMoves(state.board, from)
  const isValid = legalMoves.some((m) => m.rank === to.rank && m.file === to.file)
  if (!isValid) return null

  // Apply the move
  const newBoard = cloneBoard(state.board)
  const captured = newBoard[to.rank]![to.file] ?? null
  newBoard[to.rank]![to.file] = newBoard[from.rank]![from.file] ?? null
  newBoard[from.rank]![from.file] = null

  return {
    board: newBoard,
    turn: state.turn === "red" ? "black" : "red",
    moveCount: state.moveCount + 1,
    lastMove: { from, to },
    captured,
  }
}
