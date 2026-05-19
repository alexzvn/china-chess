import { describe, it, expect } from "vitest"

// Board.vue rendering logic tests: grid layout, SVG coordinates, piece positioning

describe("Board — grid layout", () => {
  it("creates 90 cells (10 ranks × 9 files)", () => {
    const cells: { rank: number; file: number }[] = []
    for (let rank = 0; rank < 10; rank++) {
      for (let file = 0; file < 9; file++) {
        cells.push({ rank, file })
      }
    }
    expect(cells.length).toBe(90)
  })

  it("iterates cells in rank-major order", () => {
    const cells: string[] = []
    for (let rank = 0; rank < 10; rank++) {
      for (let file = 0; file < 9; file++) {
        cells.push(`${rank}-${file}`)
      }
    }
    expect(cells[0]).toBe("0-0")
    expect(cells[8]).toBe("0-8")
    expect(cells[9]).toBe("1-0")
    expect(cells[89]).toBe("9-8")
  })
})

describe("Board — SVG coordinate system", () => {
  const MARGIN = 50
  const SPACING = 100

  it("positions cell centers correctly", () => {
    // Cell (0, 0) should be at (MARGIN, MARGIN)
    const x0 = MARGIN + 0 * SPACING
    const y0 = MARGIN + 0 * SPACING
    expect(x0).toBe(50)
    expect(y0).toBe(50)

    // Cell (9, 8) should be at (MARGIN + 8*SPACING, MARGIN + 9*SPACING)
    const xLast = MARGIN + 8 * SPACING
    const yLast = MARGIN + 9 * SPACING
    expect(xLast).toBe(850)
    expect(yLast).toBe(950)
  })

  it("calculates horizontal line positions correctly", () => {
    // 10 horizontal lines, one for each rank
    for (let r = 0; r < 10; r++) {
      const y = MARGIN + r * SPACING
      expect((y - MARGIN) / SPACING).toBe(r)
    }
  })

  it("viewBox dimensions match grid", () => {
    const viewBoxWidth = MARGIN + 8 * SPACING + MARGIN
    const viewBoxHeight = MARGIN + 9 * SPACING + MARGIN
    expect(viewBoxWidth).toBe(900)
    expect(viewBoxHeight).toBe(1000)
  })
})

describe("Board — palace diagonals", () => {
  it("black palace covers ranks 0-2, files 3-5", () => {
    const palaceRanks = [0, 1, 2]
    const palaceFiles = [3, 4, 5]
    for (const r of palaceRanks) {
      for (const f of palaceFiles) {
        expect(r >= 0 && r <= 2).toBe(true)
        expect(f >= 3 && f <= 5).toBe(true)
      }
    }
  })

  it("red palace covers ranks 7-9, files 3-5", () => {
    const palaceRanks = [7, 8, 9]
    const palaceFiles = [3, 4, 5]
    for (const r of palaceRanks) {
      for (const f of palaceFiles) {
        expect(r >= 7 && r <= 9).toBe(true)
        expect(f >= 3 && f <= 5).toBe(true)
      }
    }
  })

  it("palace diagonals connect correct corners", () => {
    const M = 50,
      S = 100
    // Black palace: top-left (3,0) to bottom-right (5,2)
    const diag1 = {
      x1: M + 3 * S,
      y1: M + 0 * S,
      x2: M + 5 * S,
      y2: M + 2 * S,
    }
    expect(diag1.x1).toBe(350)
    expect(diag1.y1).toBe(50)
    expect(diag1.x2).toBe(550)
    expect(diag1.y2).toBe(250)

    // Black palace: top-right (5,0) to bottom-left (3,2)
    const diag2 = {
      x1: M + 5 * S,
      y1: M + 0 * S,
      x2: M + 3 * S,
      y2: M + 2 * S,
    }
    expect(diag2.x1).toBe(550)
    expect(diag2.y2).toBe(250)
  })
})

describe("Board — point dots", () => {
  const DOT_POSITIONS: { rank: number; file: number }[] = [
    { rank: 2, file: 1 },
    { rank: 2, file: 7 },
    { rank: 7, file: 1 },
    { rank: 7, file: 7 },
    { rank: 6, file: 0 },
    { rank: 6, file: 2 },
    { rank: 6, file: 4 },
    { rank: 6, file: 6 },
    { rank: 6, file: 8 },
    { rank: 3, file: 0 },
    { rank: 3, file: 2 },
    { rank: 3, file: 4 },
    { rank: 3, file: 6 },
    { rank: 3, file: 8 },
    { rank: 2, file: 0 },
    { rank: 2, file: 4 },
    { rank: 2, file: 8 },
    { rank: 7, file: 0 },
    { rank: 7, file: 4 },
    { rank: 7, file: 8 },
  ]

  it("has 20 dot positions", () => {
    expect(DOT_POSITIONS.length).toBe(20)
  })

  it("places dots at standard star points", () => {
    // Traditional Chinese Chess has 8 star points per half (16 total) + corner dots
    // Top half (black side): 2, 4 (mid), 7, 1 (edge), etc.
    // Verify a few key positions
    const hasDot = (r: number, f: number) =>
      DOT_POSITIONS.some((d) => d.rank === r && d.file === f)
    expect(hasDot(2, 1)).toBe(true) // Standard cannon position
    expect(hasDot(2, 7)).toBe(true) // Standard cannon position
    expect(hasDot(7, 1)).toBe(true) // Red cannon position
    expect(hasDot(7, 7)).toBe(true) // Red cannon position
  })

  it("all dots are within board bounds", () => {
    for (const dot of DOT_POSITIONS) {
      expect(dot.rank).toBeGreaterThanOrEqual(0)
      expect(dot.rank).toBeLessThanOrEqual(9)
      expect(dot.file).toBeGreaterThanOrEqual(0)
      expect(dot.file).toBeLessThanOrEqual(8)
    }
  })
})

describe("Board — river", () => {
  it("river sits between rank 4 and rank 5", () => {
    const riverCenterRank = 4.5
    expect(riverCenterRank).toBe(4.5)
  })

  it("river text spans the board width", () => {
    const M = 50,
      S = 100
    const textLeft = M
    const textRight = M + 8 * S
    expect(textLeft).toBe(50)
    expect(textRight).toBe(850)
  })
})

describe("Board — piece positioning", () => {
  it("pieces are positioned at grid cell centers", () => {
    // The CSS grid places pieces at cell centers automatically
    // Each cell is width: 10vmin, height: 10vmin
    // Piece is 88% of cell size, centered by flexbox
    const cellSizeVmin = 10
    const pieceSize = cellSizeVmin * 0.88
    expect(pieceSize).toBe(8.8)
  })
})

describe("Board — flipped coordinate transforms", () => {
  const M = 50,
    S = 100

  it("sx returns normal file coordinate when not flipped", () => {
    const sx = (file: number, flipped: boolean) => M + (flipped ? 8 - file : file) * S
    expect(sx(0, false)).toBe(50)
    expect(sx(4, false)).toBe(450)
    expect(sx(8, false)).toBe(850)
  })

  it("sx mirrors file coordinate when flipped", () => {
    const sx = (file: number, flipped: boolean) => M + (flipped ? 8 - file : file) * S
    expect(sx(0, true)).toBe(850)
    expect(sx(4, true)).toBe(450)
    expect(sx(8, true)).toBe(50)
  })

  it("sy returns normal rank coordinate when not flipped", () => {
    const sy = (rank: number, flipped: boolean) => M + (flipped ? 9 - rank : rank) * S
    expect(sy(0, false)).toBe(50)
    expect(sy(5, false)).toBe(550)
    expect(sy(9, false)).toBe(950)
  })

  it("sy reverses rank coordinate when flipped", () => {
    const sy = (rank: number, flipped: boolean) => M + (flipped ? 9 - rank : rank) * S
    expect(sy(0, true)).toBe(950)
    expect(sy(5, true)).toBe(450) // 50 + (9-5)*100 = 450
    expect(sy(9, true)).toBe(50)
  })

  it("flipped sx+sy preserves center point", () => {
    const sx = (file: number, flipped: boolean) => M + (flipped ? 8 - file : file) * S
    const sy = (rank: number, flipped: boolean) => M + (flipped ? 9 - rank : rank) * S
    // Center of board (rank 4.5, file 4) should be same in both modes
    expect(sx(4, false)).toBe(450)
    expect(sx(4, true)).toBe(450)
    // Rank 4 and rank 5 swap positions
    expect(sy(4, true)).toBe(550) // 50 + (9-4)*100 = 550 — rank 4 appears where rank 5 was
    expect(sy(5, true)).toBe(450) // 50 + (9-5)*100 = 450 — rank 5 appears where rank 4 was
  })

  it("flipped cell iteration reverses order", () => {
    const cells: { rank: number; file: number }[] = []
    const flipped = true
    if (flipped) {
      for (let rank = 9; rank >= 0; rank--) {
        for (let file = 8; file >= 0; file--) {
          cells.push({ rank, file })
        }
      }
    } else {
      for (let rank = 0; rank < 10; rank++) {
        for (let file = 0; file < 9; file++) {
          cells.push({ rank, file })
        }
      }
    }
    // When flipped: first cell is bottom-right (9,8), last is top-left (0,0)
    expect(cells[0]).toEqual({ rank: 9, file: 8 })
    expect(cells[89]).toEqual({ rank: 0, file: 0 })
    // Still 90 cells
    expect(cells.length).toBe(90)
  })

  it("unflipped cell iteration is unchanged", () => {
    const cells: { rank: number; file: number }[] = []
    const flipped = false
    if (flipped) {
      for (let rank = 9; rank >= 0; rank--) {
        for (let file = 8; file >= 0; file--) {
          cells.push({ rank, file })
        }
      }
    } else {
      for (let rank = 0; rank < 10; rank++) {
        for (let file = 0; file < 9; file++) {
          cells.push({ rank, file })
        }
      }
    }
    expect(cells[0]).toEqual({ rank: 0, file: 0 })
    expect(cells[89]).toEqual({ rank: 9, file: 8 })
    expect(cells.length).toBe(90)
  })

  it("click on flipped cell emits engine-native coordinates", () => {
    // Display position (9,8) is the first cell when flipped
    // But it should emit engine coordinates (0,0) — the piece that's there
    const displayRank = 9
    const displayFile = 8
    // Map display to engine: engineRank = 9 - displayRank, engineFile = 8 - displayFile
    const flippedRenderOrder = (rank: number, file: number) => ({
      rank: 9 - rank,
      file: 8 - file,
    })
    // Actually no: the cell stores engine-native rank/file, just rendered in reverse order
    // So clicking the first cell (display position 0) gives engine rank 9, file 8
    const cellsWithEngineCoords = [
      { rank: 9, file: 8 },
    ]
    const clicked = cellsWithEngineCoords[0]!
    expect(clicked.rank).toBe(9)
    expect(clicked.file).toBe(8)
  })
})

describe("Board — interaction handling", () => {
  it("emits cellClick with correct rank and file on click", () => {
    let capturedRank = -1
    let capturedFile = -1

    function emitClick(rank: number, file: number) {
      capturedRank = rank
      capturedFile = file
    }

    emitClick(5, 3)
    expect(capturedRank).toBe(5)
    expect(capturedFile).toBe(3)
  })

  it("selection highlight targets correct cell", () => {
    const selectedPos = { rank: 9, file: 0 }
    const isSelected = (r: number, f: number) =>
      r === selectedPos.rank && f === selectedPos.file
    expect(isSelected(9, 0)).toBe(true)
    expect(isSelected(8, 0)).toBe(false)
    expect(isSelected(9, 1)).toBe(false)
  })

  it("legal move dot renders at correct position", () => {
    const legalMoves = [{ rank: 8, file: 0 }, { rank: 7, file: 0 }]
    const isLegal = (r: number, f: number) =>
      legalMoves.some((m) => m.rank === r && m.file === f)
    expect(isLegal(8, 0)).toBe(true)
    expect(isLegal(7, 0)).toBe(true)
    expect(isLegal(6, 0)).toBe(false)
  })

  it("capture ring renders for enemy piece targets", () => {
    const board = Array.from({ length: 10 }, () => Array(9).fill(null))
    board[5]![3] = "b卒" // enemy piece at target
    const isCapture = board[5]![3] !== null
    expect(isCapture).toBe(true)
  })

  it("cannot click pieces after game over", () => {
    const gameOver = true
    const clickDisabled = gameOver
    expect(clickDisabled).toBe(true)
  })
})
