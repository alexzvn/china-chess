import { describe, it, expect } from "bun:test"
import { isValidMove, getLegalMoves, isInCheck, isCheckmate, isStalemate, makeMove } from "./engine"
import type { Board, GameState } from "./engine"
import { isPerpetualChase, isInsufficientMaterial } from "./rules"

describe("Extended Rules", () => {
  describe("General face-to-face (將帥照面)", () => {
    it("prevents moving a piece away when it would expose generals face-to-face", () => {
      const board: Board = Array.from({ length: 10 }, () => Array(9).fill(null))
      board[7]![4] = "r帥"   // Red general at rank 7
      board[0]![4] = "b將"   // Black general at rank 0
      board[4]![4] = "b砲"   // Cannon blocking at rank 4

      const legalMoves = getLegalMoves(board, { rank: 4, file: 4 })
      for (const move of legalMoves) {
        const sim = board.map(row => [...row])
        sim[move.rank]![move.file] = sim[4]![4]
        sim[4]![4] = null
        let piecesBetween = 0
        for (let r = 1; r < 7; r++) {
          if (sim[r]![4]) piecesBetween++
        }
        expect(piecesBetween).toBeGreaterThan(0)
      }
    })

    it("allows move when generals are not on same file", () => {
      const board: Board = Array.from({ length: 10 }, () => Array(9).fill(null))
      board[7]![4] = "r帥"
      board[1]![3] = "b將"

      const isLegal = isValidMove("r帥", { rank: 7, file: 4 }, { rank: 8, file: 4 }, board)
      expect(isLegal).toBe(true)
    })

    it("detects face-to-face in getLegalMoves", () => {
      const board: Board = Array.from({ length: 10 }, () => Array(9).fill(null))
      board[7]![4] = "r帥"
      board[1]![4] = "b將"
      board[3]![4] = "b砲"

      const legalMoves = getLegalMoves(board, { rank: 3, file: 4 })
      for (const move of legalMoves) {
        const sim = board.map(row => [...row])
        sim[move.rank]![move.file] = sim[3]![4]
        sim[3]![4] = null
        const piecesBetween = []
        for (let r = 2; r < 7; r++) {
          if (sim[r]![4]) piecesBetween.push(r)
        }
        expect(piecesBetween.length).toBeGreaterThan(0)
      }
    })
  })

  describe("Perpetual chase (長捉)", () => {
    it("detects repeated position over 3 times", () => {
      // 3 repetitions of the same position → draw
      const history = [
        "rrrrr/1/3r4/9/9/9/9/9/9/9", // pos 0
        "9/9/9/9/9/9/9/9/9/9",        // pos 1
        "rrrrr/1/3r4/9/9/9/9/9/9/9", // pos 0 repeated
        "9/9/9/9/9/9/9/9/9/9",        // pos 1
        "rrrrr/1/3r4/9/9/9/9/9/9/9", // pos 0 repeated (3rd time)
      ]
      expect(isPerpetualChase(history)).toBe(true)
    })

    it("allows 2 repetitions", () => {
      const history = [
        "rrrrr/1/3r4/9/9/9/9/9/9/9",
        "9/9/9/9/9/9/9/9/9/9",
        "rrrrr/1/3r4/9/9/9/9/9/9/9",
      ]
      expect(isPerpetualChase(history)).toBe(false)
    })
  })

  describe("Insufficient material", () => {
    it("detects 帥 vs 將 only (no other pieces)", () => {
      const board: Board = Array.from({ length: 10 }, () => Array(9).fill(null))
      board[9]![4] = "r帥"
      board[0]![4] = "b將"
      expect(isInsufficientMaterial(board)).toBe(true)
    })

    it("detects 帥 + 士 vs 將", () => {
      const board: Board = Array.from({ length: 10 }, () => Array(9).fill(null))
      board[9]![4] = "r帥"
      board[0]![4] = "b將"
      board[8]![3] = "r士"
      expect(isInsufficientMaterial(board)).toBe(true)
    })


    it("returns false when a 車 exists", () => {
      const board: Board = Array.from({ length: 10 }, () => Array(9).fill(null))
      board[9]![4] = "r帥"
      board[0]![4] = "b將"
      board[5]![0] = "r車"
      expect(isInsufficientMaterial(board)).toBe(false)
    })

    it("returns false when 炮 exists", () => {
      const board: Board = Array.from({ length: 10 }, () => Array(9).fill(null))
      board[9]![4] = "r帥"
      board[0]![4] = "b將"
      board[5]![0] = "r炮"
      expect(isInsufficientMaterial(board)).toBe(false)
    })

    it("returns false when 馬 exists", () => {
      const board: Board = Array.from({ length: 10 }, () => Array(9).fill(null))
      board[9]![4] = "r帥"
      board[0]![4] = "b將"
      board[5]![0] = "r馬"
      expect(isInsufficientMaterial(board)).toBe(false)
    })
 
    it("returns false when 兵 exists", () => {
      const board: Board = Array.from({ length: 10 }, () => Array(9).fill(null))
      board[9]![4] = "r帥"
      board[0]![4] = "b將"
      board[6]![0] = "r兵"
      expect(isInsufficientMaterial(board)).toBe(false)
    })
  })
})