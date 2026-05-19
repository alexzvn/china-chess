import { describe, it, expect } from "vitest"
import { isValidMove, isInCheck, getLegalMoves, isCheckmate, isStalemate, makeMove } from "@server/game/engine"
import type { Board, GameState } from "@server/game/engine"
import { createInitialBoard } from "@server/game/board"

function emptyBoard(): Board {
  return Array.from({ length: 10 }, () => Array(9).fill(null))
}

function place(board: Board, rank: number, file: number, piece: string): Board {
  board[rank]![file] = piece
  return board
}

describe("Engine: Initial board (Issue #5)", () => {
  it("all 32 pieces on initial board", () => {
    const board = createInitialBoard()
    let count = 0
    for (let r = 0; r < 10; r++)
      for (let f = 0; f < 9; f++)
        if (board[r]![f]) count++
    expect(count).toBe(32)
  })

  it("Red chariot slides along file on initial board", () => {
    const board = createInitialBoard()
    // r車 at (9,0): can slide to (8,0) and (7,0) — empty squares
    expect(isValidMove("r車", { rank: 9, file: 0 }, { rank: 8, file: 0 }, board)).toBe(true)
    expect(isValidMove("r車", { rank: 9, file: 0 }, { rank: 7, file: 0 }, board)).toBe(true)
    // Cannot jump over own soldier at (6,0)
    expect(isValidMove("r車", { rank: 9, file: 0 }, { rank: 6, file: 0 }, board)).toBe(false)
  })
})

describe("Engine: Check and checkmate (Issue #6)", () => {
  it("detects check by enemy chariot", () => {
    const board = emptyBoard()
    place(board, 9, 4, "r帥")
    place(board, 5, 4, "b車")
    expect(isInCheck(board, "red")).toBe(true)
    expect(isInCheck(board, "black")).toBe(false)
  })

  it("detects checkmate", () => {
    const board = emptyBoard()
    place(board, 9, 4, "r帥")
    place(board, 8, 4, "b車") // Check
    place(board, 8, 0, "b車") // Protects the checking chariot
    place(board, 9, 3, "r兵") // Blocks (9,3)
    place(board, 9, 5, "r兵") // Blocks (9,5)
    expect(isCheckmate(board, "red")).toBe(true)
  })

  it("detects stalemate", () => {
    const board = emptyBoard()
    place(board, 9, 4, "r帥")
    place(board, 8, 4, "b馬")
    place(board, 8, 0, "b車")
    place(board, 9, 3, "b馬")
    place(board, 9, 0, "b車")
    place(board, 9, 5, "b馬")
    place(board, 9, 8, "b車")
    expect(isInCheck(board, "red")).toBe(false)
    expect(isStalemate(board, "red")).toBe(true)
  })

  it("makeMove applies move and switches turn", () => {
    const board = emptyBoard()
    place(board, 5, 0, "r車")
    const state: GameState = { board, turn: "red", moveCount: 0 }
    const result = makeMove(state, { rank: 5, file: 0 }, { rank: 5, file: 5 })
    expect(result).not.toBeNull()
    expect(result!.turn).toBe("black")
    expect(result!.moveCount).toBe(1)
  })

  it("getLegalMoves excludes self-check moves", () => {
    const board = emptyBoard()
    place(board, 9, 4, "r帥")
    place(board, 7, 0, "r車")
    place(board, 7, 4, "b車") // Pins the chariot
    const moves = getLegalMoves(board, { rank: 7, file: 0 })
    // All returned moves must not leave king in check
    for (const m of moves) {
      const copy = board.map((row) => [...row])
      copy[m.rank]![m.file] = copy[7]![0]!
      copy[7]![0] = null
      expect(isInCheck(copy, "red")).toBe(false)
    }
  })
})
