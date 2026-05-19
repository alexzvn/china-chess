import { describe, it, expect } from "bun:test"
import { isInCheck, getLegalMoves, isCheckmate, isStalemate, makeMove } from "./engine"
import type { Board, GameState } from "./engine"

function emptyBoard(): Board {
  return Array.from({ length: 10 }, () => Array(9).fill(null))
}

function place(board: Board, rank: number, file: number, piece: string): Board {
  board[rank]![file] = piece
  return board
}

describe("isInCheck", () => {
  it("detects check by an enemy 車 on same file", () => {
    const b = emptyBoard()
    place(b, 9, 4, "r帥")
    place(b, 5, 4, "b車") // Same file attack
    expect(isInCheck(b, "red")).toBe(true)
    expect(isInCheck(b, "black")).toBe(false)
  })

  it("detects check by an enemy 馬", () => {
    const b = emptyBoard()
    place(b, 9, 4, "r帥")
    place(b, 7, 3, "b馬") // L-shape (7,3) → (9,4): dr=2, df=1
    expect(isInCheck(b, "red")).toBe(true)
  })

  it("detects check by an enemy 炮 with screen", () => {
    const b = emptyBoard()
    place(b, 9, 4, "r帥")
    place(b, 6, 4, "b砲")
    place(b, 8, 4, "b卒") // screen, cannon jumps over to king
    expect(isInCheck(b, "red")).toBe(true)
  })

  it("returns false when no enemy threatens the king", () => {
    const b = emptyBoard()
    place(b, 9, 4, "r帥")
    place(b, 0, 0, "b車") // Far away, different file and rank
    expect(isInCheck(b, "red")).toBe(false)
  })

  it("returns false when a piece is between attacker and king", () => {
    const b = emptyBoard()
    place(b, 9, 4, "r帥")
    place(b, 5, 4, "b車")
    place(b, 7, 4, "r兵") // Blocks the file
    expect(isInCheck(b, "red")).toBe(false)
  })
})

describe("getLegalMoves", () => {
  it("excludes moves that leave own king in check (pinned piece)", () => {
    const b = emptyBoard()
    place(b, 9, 4, "r帥")
    place(b, 7, 0, "r車")
    place(b, 7, 4, "b車") // Pins red chariot: any off-rank-7 move exposes king

    const moves = getLegalMoves(b, { rank: 7, file: 0 })
    // Every returned move must not leave king in check
    for (const m of moves) {
      const copy = b.map((row) => [...row])
      copy[m.rank]![m.file] = copy[7]![0]
      copy[7]![0] = null
      expect(isInCheck(copy, "red")).toBe(false)
    }
    // At least some moves should remain (horizontal on rank 7)
    expect(moves.length).toBeGreaterThan(0)
  })

  it("includes capturing the checking piece as a legal move", () => {
    const b = emptyBoard()
    place(b, 9, 4, "r帥")
    place(b, 7, 5, "b馬") // Checking king
    place(b, 8, 5, "r車") // Can capture the 馬

    const moves = getLegalMoves(b, { rank: 8, file: 5 })
    const canCapture = moves.some((m) => m.rank === 7 && m.file === 5)
    expect(canCapture).toBe(true)
  })

  it("includes blocking the check as a legal move", () => {
    const b = emptyBoard()
    place(b, 9, 4, "r帥")
    place(b, 5, 4, "b車") // Checking through file 4
    place(b, 8, 0, "r車") // Can block at (8,4)

    const moves = getLegalMoves(b, { rank: 8, file: 0 })
    const canBlock = moves.some((m) => m.rank === 8 && m.file === 4)
    expect(canBlock).toBe(true)
  })
})

describe("isCheckmate", () => {
  it("detects checkmate — king in check with no legal moves", () => {
    // King at (9,4), b車 at (8,4) gives check
    // b車 at (8,0) protects the checking chariot (king can't capture it)
    // Own r兵 block (9,3) and (9,5) so king can't escape there
    const b = emptyBoard()
    place(b, 9, 4, "r帥")
    place(b, 8, 4, "b車") // Checking chariot
    place(b, 8, 0, "b車") // Protects (8,4) — king can't capture
    place(b, 9, 3, "r兵") // Blocks (9,3) with own piece
    place(b, 9, 5, "r兵") // Blocks (9,5) with own piece
    expect(isCheckmate(b, "red")).toBe(true)
    expect(isCheckmate(b, "black")).toBe(false)
  })

  it("returns false when king can escape check", () => {
    const b = emptyBoard()
    place(b, 9, 4, "r帥")
    place(b, 6, 4, "b車") // Check through file 4
    // King can move to (9,3) or (9,5) to escape
    expect(isCheckmate(b, "red")).toBe(false)
  })
})

describe("isStalemate", () => {
  it("detects stalemate — no legal moves but not in check", () => {
    // King at (9,4) surrounded by 3 b馬s that don't check (not L-shape from adjacent).
    // Each b馬 is protected by a b車 on the same rank, so capturing exposes king.
    // The b車s themselves are blocked by the b馬s from checking the king.
    const b = emptyBoard()
    place(b, 9, 4, "r帥")
    // Block all three escape squares with b馬 (adjacent but NOT L-shape from there)
    place(b, 8, 4, "b馬") // blocks above, protector on same rank
    place(b, 9, 3, "b馬") // blocks left, protector on same rank
    place(b, 9, 5, "b馬") // blocks right, protector on same rank
    // Protect each b馬 with a b車 that attacks its rank
    place(b, 8, 0, "b車") // Protects (8,4) after capture
    place(b, 9, 0, "b車") // Protects (9,3) after capture — blocked from king by b馬 at (9,3)
    place(b, 9, 8, "b車") // Protects (9,5) after capture — blocked from king by b馬 at (9,5)

    expect(isInCheck(b, "red")).toBe(false)
    expect(isStalemate(b, "red")).toBe(true)
  })
})

describe("makeMove", () => {
  it("applies a valid move and switches turn", () => {
    const b = emptyBoard()
    place(b, 5, 0, "r車")
    const state: GameState = { board: b, turn: "red", moveCount: 0 }

    const result = makeMove(state, { rank: 5, file: 0 }, { rank: 5, file: 5 })
    expect(result).not.toBeNull()
    expect(result!.board[5]![5]).toBe("r車")
    expect(result!.board[5]![0]).toBeNull()
    expect(result!.turn).toBe("black")
    expect(result!.moveCount).toBe(1)
  })

  it("rejects an illegal move (self-check)", () => {
    const b = emptyBoard()
    place(b, 9, 4, "r帥")
    place(b, 7, 0, "r車")
    place(b, 7, 4, "b車") // Pins the r車 — moving vertically exposes king

    const state: GameState = { board: b, turn: "red", moveCount: 0 }
    const result = makeMove(state, { rank: 7, file: 0 }, { rank: 6, file: 0 })
    expect(result).toBeNull()
  })

  it("rejects a move that breaks piece movement rules", () => {
    const b = emptyBoard()
    place(b, 5, 0, "r車")
    const state: GameState = { board: b, turn: "red", moveCount: 0 }

    const result = makeMove(state, { rank: 5, file: 0 }, { rank: 6, file: 1 })
    expect(result).toBeNull()
  })

  it("rejects a move when it's not that player's turn", () => {
    const b = emptyBoard()
    place(b, 5, 0, "r車")
    const state: GameState = { board: b, turn: "black", moveCount: 0 }

    const result = makeMove(state, { rank: 5, file: 0 }, { rank: 5, file: 5 })
    expect(result).toBeNull()
  })
})
