import type { Board } from "./engine"

/** Standard Chinese Chess starting board */
export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: 10 }, () => Array(9).fill(null))

  // Black pieces (top, ranks 0-4)
  board[0] = ["b車", "b馬", "b象", "b士", "b將", "b士", "b象", "b馬", "b車"]
  board[2]![1] = "b砲"
  board[2]![7] = "b砲"
  board[3]![0] = "b卒"
  board[3]![2] = "b卒"
  board[3]![4] = "b卒"
  board[3]![6] = "b卒"
  board[3]![8] = "b卒"

  // Red pieces (bottom, ranks 5-9)
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
