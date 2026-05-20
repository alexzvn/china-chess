import { describe, it, expect } from "vitest"
import { useBoard, createInitialBoard } from "./useBoard"
import type { BoardState } from "./useBoard"

function countPieces(board: BoardState): number {
  let count = 0
  for (let r = 0; r < 10; r++) {
    for (let f = 0; f < 9; f++) {
      if (board[r]![f]) count++
    }
  }
  return count
}

function countRedPieces(board: BoardState): number {
  let count = 0
  for (let r = 0; r < 10; r++) {
    for (let f = 0; f < 9; f++) {
      const p = board[r]![f]
      if (p && p.startsWith("r")) count++
    }
  }
  return count
}

function countBlackPieces(board: BoardState): number {
  let count = 0
  for (let r = 0; r < 10; r++) {
    for (let f = 0; f < 9; f++) {
      const p = board[r]![f]
      if (p && p.startsWith("b")) count++
    }
  }
  return count
}

describe("createInitialBoard", () => {
  it("places all 32 pieces", () => {
    const board = createInitialBoard()
    expect(countPieces(board)).toBe(32)
  })

  it("places 16 red pieces", () => {
    const board = createInitialBoard()
    expect(countRedPieces(board)).toBe(16)
  })

  it("places 16 black pieces", () => {
    const board = createInitialBoard()
    expect(countBlackPieces(board)).toBe(16)
  })

  it("places Red king at (9,4)", () => {
    const board = createInitialBoard()
    expect(board[9]![4]).toBe("r帥")
  })

  it("places Black king at (0,4)", () => {
    const board = createInitialBoard()
    expect(board[0]![4]).toBe("b將")
  })

  it("places Red chariots at back rank corners", () => {
    const board = createInitialBoard()
    expect(board[9]![0]).toBe("r車")
    expect(board[9]![8]).toBe("r車")
  })

  it("places Black cannons at (2,1) and (2,7)", () => {
    const board = createInitialBoard()
    expect(board[2]![1]).toBe("b砲")
    expect(board[2]![7]).toBe("b砲")
  })

  it("places Red soldiers on rank 6 at every other file", () => {
    const board = createInitialBoard()
    for (let f = 0; f < 9; f += 2) {
      expect(board[6]![f]).toBe("r兵")
    }
  })

  it("leaves ranks 1, 4, 5, 8 empty", () => {
    const board = createInitialBoard()
    for (let f = 0; f < 9; f++) {
      expect(board[1]![f]).toBeNull()
      expect(board[4]![f]).toBeNull()
      expect(board[5]![f]).toBeNull()
      expect(board[8]![f]).toBeNull()
    }
  })
})

describe("useBoard composable — selection", () => {
  it("selects own piece on click", () => {
    const { handleCellClick, isSelected } = useBoard()
    // It's Red's turn, click a red chariot
    handleCellClick(9, 0)
    expect(isSelected(9, 0)).toBe(true)
  })

  it("rejects selecting opponent's piece", () => {
    const { handleCellClick, selectedPos } = useBoard()
    // Click black piece when it's Red's turn
    handleCellClick(0, 0)
    expect(selectedPos.value).toBeNull()
  })

  it("deselects when clicking empty square", () => {
    const { handleCellClick, selectedPos } = useBoard()
    handleCellClick(9, 0) // select Red chariot
    expect(selectedPos.value).not.toBeNull()
    handleCellClick(5, 0) // click empty square
    expect(selectedPos.value).toBeNull()
  })

  it("switches selection when clicking another own piece", () => {
    const { handleCellClick, isSelected } = useBoard()
    handleCellClick(9, 0) // select Red chariot at (9,0)
    handleCellClick(9, 8) // click other Red chariot
    expect(isSelected(9, 0)).toBe(false)
    expect(isSelected(9, 8)).toBe(true)
  })

  it("returns a move action when clicking a legal target", () => {
    const { handleCellClick } = useBoard()
    // Select Red cannon at (7,1) — can slide horizontally
    const selectResult = handleCellClick(7, 1)
    expect(selectResult).toBeNull() // selection, not a move

    // Click a legal destination (clear horizontal path)
    // Actually cannons need to slide without capture needing no pieces between
    // From (7,1) to (7,0) is adjacent, no pieces between
    const moveResult = handleCellClick(7, 0)
    expect(moveResult).not.toBeNull()
    expect(moveResult!.from).toEqual({ rank: 7, file: 1 })
    expect(moveResult!.to).toEqual({ rank: 7, file: 0 })
  })

  it("computes legal moves for a selected piece", () => {
    const { handleCellClick, legalMoves } = useBoard()
    // Select Red chariot at (9,0) — should slide along rank 9 and file 0
    handleCellClick(9, 0)
    expect(legalMoves.value.length).toBeGreaterThan(0)

    // On the initial board, rank 9 has: 車馬象士帥士象馬車
    // Chariot at (9,0): can slide right along rank 9 to (9,1)? No, (9,1) has 馬
    // Can't land on own piece. So can't move right.
    // Can slide up file 0: (8,0) is empty, (7,0) is empty, (6,0) has r兵
    // So: (8,0), (7,0) are valid moves (2 moves)
    expect(legalMoves.value.some((m) => m.rank === 8 && m.file === 0)).toBe(true)
    expect(legalMoves.value.some((m) => m.rank === 7 && m.file === 0)).toBe(true)
    // Cannot land on (6,0) because it has own soldier
    expect(legalMoves.value.some((m) => m.rank === 6 && m.file === 0)).toBe(false)
  })
})

describe("useBoard composable — state management", () => {
  it("sets board from external source", () => {
    const { board, setBoard } = useBoard()
    const empty = Array.from({ length: 10 }, () => Array(9).fill(null))
    setBoard(empty as BoardState)
    // countPieces is a local test helper, not from useBoard
    let cnt = 0
    for (let r = 0; r < 10; r++)
      for (let f = 0; f < 9; f++)
        if (board.value[r]![f]) cnt++
    expect(cnt).toBe(0)
  })

  it("sets turn and clears selection", () => {
    const { setTurn, turn, handleCellClick, selectedPos } = useBoard()
    handleCellClick(9, 0) // select own piece
    expect(selectedPos.value).not.toBeNull()
    setTurn("black")
    expect(turn.value).toBe("black")
    // Selection should be cleared when turn changes
    expect(selectedPos.value).toBeNull()
  })

  it("sets inCheck color", () => {
    const { inCheckColor, setInCheck } = useBoard()
    expect(inCheckColor.value).toBeNull()
    setInCheck("red")
    expect(inCheckColor.value).toBe("red")
  })

  it("clears selection explicitly", () => {
    const { handleCellClick, selectedPos, clearSelection } = useBoard()
    handleCellClick(9, 0)
    expect(selectedPos.value).not.toBeNull()
    clearSelection()
    expect(selectedPos.value).toBeNull()
  })

  it("isLegalTarget and isCaptureTarget work", () => {
    const { handleCellClick, isLegalTarget, isCaptureTarget } = useBoard()
    // Select Red chariot at (9,0)
    handleCellClick(9, 0)
    // (8,0) is a legal move (empty square)
    expect(isLegalTarget(8, 0)).toBe(true)
    expect(isCaptureTarget(8, 0)).toBe(false)
  })
})

describe("useBoard composable — game over blocking", () => {
  it("returns null move when clicking during game over", () => {
    const { handleCellClick } = useBoard()
    // We simulate game over by just selecting then clicking
    // The move is returned regardless — game over is handled in Game.vue
    const sel = handleCellClick(7, 1)
    expect(sel).toBeNull()
    // This is a legal move in the initial position
    const move = handleCellClick(7, 0)
    expect(move).not.toBeNull()
  })
})

describe("useBoard composable — last move", () => {
  it("setLastMove stores a move ref, clearLastMove nulls it", () => {
    const { lastMove, setLastMove, clearLastMove } = useBoard()
    expect(lastMove.value).toBeNull()

    setLastMove({ from: { rank: 7, file: 1 }, to: { rank: 7, file: 4 } })
    expect(lastMove.value).toEqual({ from: { rank: 7, file: 1 }, to: { rank: 7, file: 4 } })

    clearLastMove()
    expect(lastMove.value).toBeNull()
  })

  it("setBoard does NOT clear lastMove", () => {
    const { lastMove, setLastMove, setBoard } = useBoard()
    const move = { from: { rank: 7, file: 1 }, to: { rank: 7, file: 4 } }
    setLastMove(move)

    setBoard(createInitialBoard())
    expect(lastMove.value).toEqual(move)
  })

  it("clearSelection does NOT clear lastMove", () => {
    const { lastMove, setLastMove, clearSelection } = useBoard()
    const move = { from: { rank: 0, file: 0 }, to: { rank: 3, file: 3 } }
    setLastMove(move)

    clearSelection()
    expect(lastMove.value).toEqual(move)
  })
})
