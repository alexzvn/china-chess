import { ref, computed } from "vue"
import { getLegalMoves } from "@server/game/engine"
import type { Position, Board } from "@server/game/engine"

// BoardState is just Board from the engine (2D array of string | null)
export type BoardState = Board
export type { Position }

function getPieceColor(piece: string): "red" | "black" {
  return piece.startsWith("r") ? "red" : "black"
}

export function createInitialBoard(): BoardState {
  const board: BoardState = Array.from({ length: 10 }, () => Array(9).fill(null))
  board[0] = ["b車", "b馬", "b象", "b士", "b將", "b士", "b象", "b馬", "b車"]
  board[2]![1] = "b砲"
  board[2]![7] = "b砲"
  board[3]![0] = "b卒"
  board[3]![2] = "b卒"
  board[3]![4] = "b卒"
  board[3]![6] = "b卒"
  board[3]![8] = "b卒"
  board[9] = ["r車", "r馬", "r象", "r士", "r帥", "r士", "r象", "r馬", "r車"]
  board[7]![1] = "r炮"
  board[7]![7] = "r炮"
  board[6]![0] = "r兵"
  board[6]![2] = "r兵"
  board[6]![4] = "r兵"
  board[6]![6] = "r兵"
  board[6]![8] = "r兵"
  return board
}

export function useBoard() {
  const board = ref<BoardState>(createInitialBoard())
  const turn = ref<"red" | "black">("red")
  const selectedPos = ref<Position | null>(null)
  const inCheckColor = ref<"red" | "black" | null>(null)

  const legalMoves = computed<Position[]>(() => {
    if (!selectedPos.value) return []
    const piece = board.value[selectedPos.value.rank]![selectedPos.value.file]
    if (!piece) return []
    return getLegalMoves(board.value, selectedPos.value)
  })

  /** Set board from external source (server update) */
  function setBoard(newBoard: BoardState) {
    board.value = newBoard
    clearSelection()
  }

  function setTurn(newTurn: "red" | "black") {
    turn.value = newTurn
    clearSelection()
  }

  function setInCheck(color: "red" | "black" | null) {
    inCheckColor.value = color
  }

  function selectPiece(pos: Position) {
    const piece = board.value[pos.rank]![pos.file]
    if (!piece) return false
    const color = getPieceColor(piece)
    if (color !== turn.value) return false
    selectedPos.value = pos
    return true
  }

  function clearSelection() {
    selectedPos.value = null
  }

  function isSelected(rank: number, file: number): boolean {
    return selectedPos.value?.rank === rank && selectedPos.value?.file === file
  }

  function isLegalTarget(rank: number, file: number): boolean {
    return legalMoves.value.some((m) => m.rank === rank && m.file === file)
  }

  function isCaptureTarget(rank: number, file: number): boolean {
    return isLegalTarget(rank, file) && board.value[rank]![file] !== null
  }

  /**
   * Handle a cell click. Returns a move action if the click was a legal move,
   * or null if it was a select/deselect action.
   */
  function handleCellClick(
    rank: number,
    file: number,
  ): { from: Position; to: Position } | null {
    const clickedPiece = board.value[rank]![file]
    const currentSelection = selectedPos.value

    if (currentSelection) {
      if (isLegalTarget(rank, file)) {
        // Legal move — return it to the caller
        const move = { from: currentSelection, to: { rank, file } }
        clearSelection()
        return move
      }

      // Clicked own piece or empty → switch or deselect
      if (clickedPiece && getPieceColor(clickedPiece) === turn.value) {
        selectPiece({ rank, file })
        return null
      }

      clearSelection()
      return null
    }

    selectPiece({ rank, file })
    return null
  }

  return {
    board,
    turn,
    selectedPos,
    legalMoves,
    inCheckColor,
    setBoard,
    setTurn,
    setInCheck,
    selectPiece,
    clearSelection,
    isSelected,
    isLegalTarget,
    isCaptureTarget,
    handleCellClick,
  }
}
