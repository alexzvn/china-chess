import { describe, it, expect } from "bun:test"
import { isValidMove } from "./engine"
import type { Board } from "./engine"

function emptyBoard(): Board {
  return Array.from({ length: 10 }, () => Array(9).fill(null))
}

function place(board: Board, rank: number, file: number, piece: string): Board {
  board[rank]![file] = piece
  return board
}

describe("Piece: 車 (Chariot)", () => {
  it("slides orthogonally in all 4 directions", () => {
    const b = place(emptyBoard(), 5, 4, "r車")
    expect(isValidMove("r車", { rank: 5, file: 4 }, { rank: 5, file: 8 }, b)).toBe(true)
    expect(isValidMove("r車", { rank: 5, file: 4 }, { rank: 5, file: 0 }, b)).toBe(true)
    expect(isValidMove("r車", { rank: 5, file: 4 }, { rank: 0, file: 4 }, b)).toBe(true)
    expect(isValidMove("r車", { rank: 5, file: 4 }, { rank: 9, file: 4 }, b)).toBe(true)
  })

  it("cannot move diagonally", () => {
    const b = place(emptyBoard(), 5, 4, "r車")
    expect(isValidMove("r車", { rank: 5, file: 4 }, { rank: 6, file: 5 }, b)).toBe(false)
  })

  it("cannot jump over pieces", () => {
    const b = place(emptyBoard(), 5, 0, "r車")
    place(b, 5, 3, "b卒")
    expect(isValidMove("r車", { rank: 5, file: 0 }, { rank: 5, file: 6 }, b)).toBe(false)
  })

  it("can capture enemy piece", () => {
    const b = place(emptyBoard(), 5, 0, "r車")
    place(b, 5, 5, "b卒")
    expect(isValidMove("r車", { rank: 5, file: 0 }, { rank: 5, file: 5 }, b)).toBe(true)
  })

  it("cannot land on friendly piece", () => {
    const b = place(emptyBoard(), 5, 0, "r車")
    place(b, 5, 5, "r兵")
    expect(isValidMove("r車", { rank: 5, file: 0 }, { rank: 5, file: 5 }, b)).toBe(false)
  })

  it("rejects off-board destinations", () => {
    const b = place(emptyBoard(), 5, 4, "r車")
    expect(isValidMove("r車", { rank: 5, file: 4 }, { rank: 5, file: -1 }, b)).toBe(false)
    expect(isValidMove("r車", { rank: 5, file: 4 }, { rank: 10, file: 4 }, b)).toBe(false)
  })
})

describe("Piece: 馬 (Horse)", () => {
  it("moves in L-shape (2+1) in all 8 directions", () => {
    const b = place(emptyBoard(), 5, 4, "r馬")
    // 2 up 1 left, 2 up 1 right
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 3, file: 3 }, b)).toBe(true)
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 3, file: 5 }, b)).toBe(true)
    // 2 down 1 left, 2 down 1 right
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 7, file: 3 }, b)).toBe(true)
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 7, file: 5 }, b)).toBe(true)
    // 1 up 2 left, 1 down 2 left
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 4, file: 2 }, b)).toBe(true)
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 6, file: 2 }, b)).toBe(true)
    // 1 up 2 right, 1 down 2 right
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 4, file: 6 }, b)).toBe(true)
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 6, file: 6 }, b)).toBe(true)
  })

  it("is blocked by leg piece in all 4 axial directions", () => {
    // Leg = adjacent square in the direction of the 2-step
    const b = place(emptyBoard(), 5, 4, "r馬")
    // Block up-leg at (4,4) → cannot move up
    place(b, 4, 4, "b卒")
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 3, file: 3 }, b)).toBe(false)
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 3, file: 5 }, b)).toBe(false)
    // Block down-leg at (6,4) → cannot move down
    place(b, 6, 4, "b卒")
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 7, file: 3 }, b)).toBe(false)
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 7, file: 5 }, b)).toBe(false)
  })

  it("is blocked by leg piece for sideways moves", () => {
    const b = place(emptyBoard(), 5, 4, "r馬")
    // Block left-leg at (5,3) → cannot move left (2-step left)
    place(b, 5, 3, "b卒")
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 4, file: 2 }, b)).toBe(false)
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 6, file: 2 }, b)).toBe(false)
  })

  it("can still move in unblocked directions when one leg is blocked", () => {
    const b = place(emptyBoard(), 5, 4, "r馬")
    place(b, 4, 4, "b卒") // block up-leg
    // Right side should still work
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 4, file: 6 }, b)).toBe(true)
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 6, file: 6 }, b)).toBe(true)
  })

  it("cannot move in non-L pattern", () => {
    const b = place(emptyBoard(), 5, 4, "r馬")
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 4, file: 4 }, b)).toBe(false) // 1 step
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 3, file: 4 }, b)).toBe(false) // 2 steps orth
    expect(isValidMove("r馬", { rank: 5, file: 4 }, { rank: 5, file: 7 }, b)).toBe(false) // 3 steps
  })
})

describe("Piece: 炮/砲 (Cannon)", () => {
  it("slides without capturing when no pieces between", () => {
    const b = place(emptyBoard(), 5, 0, "r炮")
    expect(isValidMove("r炮", { rank: 5, file: 0 }, { rank: 5, file: 5 }, b)).toBe(true)
  })

  it("captures by jumping over exactly one piece (screen)", () => {
    const b = place(emptyBoard(), 5, 0, "r炮")
    place(b, 5, 3, "b卒") // screen
    place(b, 5, 6, "b車") // target
    expect(isValidMove("r炮", { rank: 5, file: 0 }, { rank: 5, file: 6 }, b)).toBe(true)
  })

  it("cannot capture without a screen", () => {
    const b = place(emptyBoard(), 5, 0, "r炮")
    place(b, 5, 5, "b車")
    expect(isValidMove("r炮", { rank: 5, file: 0 }, { rank: 5, file: 5 }, b)).toBe(false)
  })

  it("cannot capture with more than one screen", () => {
    const b = place(emptyBoard(), 5, 0, "r炮")
    place(b, 5, 2, "b卒")
    place(b, 5, 4, "b卒")
    place(b, 5, 6, "b車")
    expect(isValidMove("r炮", { rank: 5, file: 0 }, { rank: 5, file: 6 }, b)).toBe(false)
  })

  it("cannot slide through a piece onto an empty square", () => {
    const b = place(emptyBoard(), 5, 0, "r炮")
    place(b, 5, 3, "b卒") // screen between source and target
    // The screen blocks the slide; to reach (5,4), cannon would need a target
    expect(isValidMove("r炮", { rank: 5, file: 0 }, { rank: 5, file: 4 }, b)).toBe(false)
  })

  it("works with 砲 (black cannon)", () => {
    const b = place(emptyBoard(), 5, 8, "b砲")
    place(b, 5, 5, "r卒") // screen
    place(b, 5, 2, "r車") // capture target
    expect(isValidMove("b砲", { rank: 5, file: 8 }, { rank: 5, file: 2 }, b)).toBe(true)
  })
})

describe("Piece: 士 (Advisor)", () => {
  it("moves one step diagonally within the palace", () => {
    // Red palace: ranks 7-9, files 3-5
    const b = place(emptyBoard(), 8, 4, "r士")
    expect(isValidMove("r士", { rank: 8, file: 4 }, { rank: 9, file: 3 }, b)).toBe(true)
    expect(isValidMove("r士", { rank: 8, file: 4 }, { rank: 9, file: 5 }, b)).toBe(true)
    expect(isValidMove("r士", { rank: 8, file: 4 }, { rank: 7, file: 3 }, b)).toBe(true)
    expect(isValidMove("r士", { rank: 8, file: 4 }, { rank: 7, file: 5 }, b)).toBe(true)
  })

  it("cannot leave the palace", () => {
    // Corner of palace: (9, 3)
    const b = place(emptyBoard(), 9, 3, "r士")
    expect(isValidMove("r士", { rank: 9, file: 3 }, { rank: 8, file: 2 }, b)).toBe(false) // file 2 is outside
    expect(isValidMove("r士", { rank: 9, file: 3 }, { rank: 8, file: 4 }, b)).toBe(true) // inside
  })

  it("cannot move orthogonally", () => {
    const b = place(emptyBoard(), 8, 4, "r士")
    expect(isValidMove("r士", { rank: 8, file: 4 }, { rank: 7, file: 4 }, b)).toBe(false)
    expect(isValidMove("r士", { rank: 8, file: 4 }, { rank: 8, file: 5 }, b)).toBe(false)
  })

  it("Black advisor confined to black palace (ranks 0-2)", () => {
    const b = place(emptyBoard(), 1, 4, "b士")
    expect(isValidMove("b士", { rank: 1, file: 4 }, { rank: 0, file: 3 }, b)).toBe(true)
    expect(isValidMove("b士", { rank: 1, file: 4 }, { rank: 0, file: 5 }, b)).toBe(true)
    expect(isValidMove("b士", { rank: 1, file: 4 }, { rank: 2, file: 3 }, b)).toBe(true)
    expect(isValidMove("b士", { rank: 1, file: 4 }, { rank: 2, file: 5 }, b)).toBe(true)
    expect(isValidMove("b士", { rank: 1, file: 4 }, { rank: 0, file: 4 }, b)).toBe(false) // orthogonal
  })
})

describe("Piece: 象 (Elephant)", () => {
  it("moves two steps diagonally on its own side of the river", () => {
    const b = place(emptyBoard(), 7, 4, "r象")
    expect(isValidMove("r象", { rank: 7, file: 4 }, { rank: 5, file: 2 }, b)).toBe(true)
    expect(isValidMove("r象", { rank: 7, file: 4 }, { rank: 5, file: 6 }, b)).toBe(true)
    expect(isValidMove("r象", { rank: 7, file: 4 }, { rank: 9, file: 2 }, b)).toBe(true)
    expect(isValidMove("r象", { rank: 7, file: 4 }, { rank: 9, file: 6 }, b)).toBe(true)
  })

  it("cannot cross the river", () => {
    // Red 象 at rank 5, move to rank 3 would cross river (rank 4 is the river)
    const b = place(emptyBoard(), 5, 2, "r象")
    expect(isValidMove("r象", { rank: 5, file: 2 }, { rank: 3, file: 0 }, b)).toBe(false)
    expect(isValidMove("r象", { rank: 5, file: 2 }, { rank: 3, file: 4 }, b)).toBe(false)
  })

  it("is blocked by eye piece", () => {
    const b = place(emptyBoard(), 5, 6, "r象") // rank 5 file 6 → red side
    // Eye for (5,6) → (7,4) is at (6,5)
    place(b, 6, 5, "b卒") // blocks eye
    expect(isValidMove("r象", { rank: 5, file: 6 }, { rank: 7, file: 4 }, b)).toBe(false)
  })

  it("cannot move when not 2-diagonal steps", () => {
    const b = place(emptyBoard(), 7, 2, "r象")
    expect(isValidMove("r象", { rank: 7, file: 2 }, { rank: 6, file: 2 }, b)).toBe(false)
    expect(isValidMove("r象", { rank: 7, file: 2 }, { rank: 5, file: 3 }, b)).toBe(false)
  })

  it("Black elephant cannot cross river upward", () => {
    const b = place(emptyBoard(), 2, 4, "b象")
    expect(isValidMove("b象", { rank: 2, file: 4 }, { rank: 4, file: 2 }, b)).toBe(true)
    expect(isValidMove("b象", { rank: 2, file: 4 }, { rank: 4, file: 6 }, b)).toBe(true)
    expect(isValidMove("b象", { rank: 2, file: 4 }, { rank: 0, file: 2 }, b)).toBe(true)
    expect(isValidMove("b象", { rank: 2, file: 4 }, { rank: 0, file: 6 }, b)).toBe(true)
    // Cannot cross to red side (rank >= 5)
    expect(isValidMove("b象", { rank: 4, file: 2 }, { rank: 6, file: 0 }, b)).toBe(false)
  })
})

describe("Piece: 將/帥 (General)", () => {
  it("moves one step orthogonally within the palace", () => {
    const b = place(emptyBoard(), 8, 4, "r帥")
    expect(isValidMove("r帥", { rank: 8, file: 4 }, { rank: 9, file: 4 }, b)).toBe(true)
    expect(isValidMove("r帥", { rank: 8, file: 4 }, { rank: 7, file: 4 }, b)).toBe(true)
    expect(isValidMove("r帥", { rank: 8, file: 4 }, { rank: 8, file: 3 }, b)).toBe(true)
    expect(isValidMove("r帥", { rank: 8, file: 4 }, { rank: 8, file: 5 }, b)).toBe(true)
  })

  it("cannot leave the palace", () => {
    const b = place(emptyBoard(), 8, 4, "r帥")
    expect(isValidMove("r帥", { rank: 8, file: 4 }, { rank: 7, file: 3 }, b)).toBe(false) // diagonal
    expect(isValidMove("r帥", { rank: 8, file: 4 }, { rank: 8, file: 2 }, b)).toBe(false) // outside palace
    expect(isValidMove("r帥", { rank: 8, file: 4 }, { rank: 6, file: 4 }, b)).toBe(false) // outside palace rank
  })

  it("Black general (將) confined to black palace", () => {
    const b = place(emptyBoard(), 1, 4, "b將")
    expect(isValidMove("b將", { rank: 1, file: 4 }, { rank: 0, file: 4 }, b)).toBe(true)
    expect(isValidMove("b將", { rank: 1, file: 4 }, { rank: 2, file: 4 }, b)).toBe(true)
    expect(isValidMove("b將", { rank: 1, file: 4 }, { rank: 1, file: 3 }, b)).toBe(true)
    expect(isValidMove("b將", { rank: 1, file: 4 }, { rank: 1, file: 2 }, b)).toBe(false) // outside palace
  })
})

describe("Piece: 兵/卒 (Soldier)", () => {
  it("Red soldier moves one step forward (up, rank--) before crossing river", () => {
    const b = place(emptyBoard(), 6, 4, "r兵")
    expect(isValidMove("r兵", { rank: 6, file: 4 }, { rank: 5, file: 4 }, b)).toBe(true)
    expect(isValidMove("r兵", { rank: 6, file: 4 }, { rank: 6, file: 5 }, b)).toBe(false) // sideways before river
  })

  it("Red soldier can move sideways after crossing the river", () => {
    const b = place(emptyBoard(), 4, 4, "r兵") // On black side (crossed river at rank <= 4)
    expect(isValidMove("r兵", { rank: 4, file: 4 }, { rank: 3, file: 4 }, b)).toBe(true) // forward
    expect(isValidMove("r兵", { rank: 4, file: 4 }, { rank: 4, file: 5 }, b)).toBe(true) // sideways right
    expect(isValidMove("r兵", { rank: 4, file: 4 }, { rank: 4, file: 3 }, b)).toBe(true) // sideways left
  })

  it("Red soldier cannot move backward (down)", () => {
    const b = place(emptyBoard(), 6, 4, "r兵")
    expect(isValidMove("r兵", { rank: 6, file: 4 }, { rank: 7, file: 4 }, b)).toBe(false)
  })

  it("Red soldier cannot move backward even after crossing river", () => {
    const b = place(emptyBoard(), 3, 4, "r兵")
    expect(isValidMove("r兵", { rank: 3, file: 4 }, { rank: 4, file: 4 }, b)).toBe(false) // backward
    expect(isValidMove("r兵", { rank: 3, file: 4 }, { rank: 2, file: 4 }, b)).toBe(true) // forward
    expect(isValidMove("r兵", { rank: 3, file: 4 }, { rank: 3, file: 5 }, b)).toBe(true) // sideways
  })

  it("Black soldier moves one step forward (down, rank++)", () => {
    const b = place(emptyBoard(), 3, 4, "b卒")
    expect(isValidMove("b卒", { rank: 3, file: 4 }, { rank: 4, file: 4 }, b)).toBe(true) // forward (down)
    expect(isValidMove("b卒", { rank: 3, file: 4 }, { rank: 3, file: 5 }, b)).toBe(false) // sideways before river
  })

  it("Black soldier can move sideways after crossing river", () => {
    const b = place(emptyBoard(), 5, 4, "b卒") // On red side (crossed river at rank >= 5)
    expect(isValidMove("b卒", { rank: 5, file: 4 }, { rank: 6, file: 4 }, b)).toBe(true) // forward
    expect(isValidMove("b卒", { rank: 5, file: 4 }, { rank: 5, file: 3 }, b)).toBe(true) // sideways
    expect(isValidMove("b卒", { rank: 5, file: 4 }, { rank: 5, file: 5 }, b)).toBe(true) // sideways
  })

  it("Black soldier cannot move backward (up)", () => {
    const b = place(emptyBoard(), 3, 4, "b卒")
    expect(isValidMove("b卒", { rank: 3, file: 4 }, { rank: 2, file: 4 }, b)).toBe(false)
  })

  it("cannot move more than one step", () => {
    const b = place(emptyBoard(), 6, 4, "r兵")
    expect(isValidMove("r兵", { rank: 6, file: 4 }, { rank: 4, file: 4 }, b)).toBe(false) // 2 steps
  })
})

describe("Boundaries and edge cases", () => {
  it("rejects moves from off-board positions", () => {
    const b = emptyBoard()
    expect(isValidMove("r車", { rank: -1, file: 4 }, { rank: 0, file: 4 }, b)).toBe(false)
  })

  it("rejects moves that stay in place", () => {
    const b = place(emptyBoard(), 5, 4, "r車")
    expect(isValidMove("r車", { rank: 5, file: 4 }, { rank: 5, file: 4 }, b)).toBe(false)
  })

  it("rejects unknown piece types", () => {
    const b = emptyBoard()
    expect(isValidMove("r?", { rank: 5, file: 4 }, { rank: 5, file: 5 }, b)).toBe(false)
  })
})
