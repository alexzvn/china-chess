<script setup lang="ts">
import { computed } from "vue"
import Piece from "./Piece.vue"
import type { BoardState } from "../composables/useBoard"

const props = defineProps<{
  board: BoardState
}>()

interface CellPos {
  rank: number
  file: number
  piece: string | null
}

const cells = computed<CellPos[]>(() => {
  const result: CellPos[] = []
  for (let rank = 0; rank < 10; rank++) {
    for (let file = 0; file < 9; file++) {
      result.push({
        rank,
        file,
        piece: props.board[rank]![file] ?? null,
      })
    }
  }
  return result
})

const DOT_POSITIONS: { rank: number; file: number }[] = [
  { rank: 2, file: 1 }, { rank: 2, file: 7 },
  { rank: 7, file: 1 }, { rank: 7, file: 7 },
  { rank: 6, file: 0 }, { rank: 6, file: 2 }, { rank: 6, file: 4 }, { rank: 6, file: 6 }, { rank: 6, file: 8 },
  { rank: 3, file: 0 }, { rank: 3, file: 2 }, { rank: 3, file: 4 }, { rank: 3, file: 6 }, { rank: 3, file: 8 },
  { rank: 2, file: 0 }, { rank: 2, file: 4 }, { rank: 2, file: 8 },
  { rank: 7, file: 0 }, { rank: 7, file: 4 }, { rank: 7, file: 8 },
]

function isDot(rank: number, file: number): boolean {
  return DOT_POSITIONS.some((d) => d.rank === rank && d.file === file)
}

// File number in SVG coordinate: margin + file * spacing
const M = 50 // margin
const S = 100 // spacing between intersections
// Cell center in SVG = (M + file * S, M + rank * S)
// Board SVG viewBox = "0 0 900 1050" (M on each side + 9*S  + M, M on each side + 10*S + M?)
// Actually: max X = M + 8*S + M = 50 + 800 + 50 = 900
// max Y = M + 9*S + M = 50 + 900 + 50 = 1000
// viewBox = "0 0 900 1000"
</script>

<template>
  <div class="board-wrapper inline-block">
    <div class="board-surface relative overflow-hidden" :style="{ width: '90vmin', height: '100vmin' }">
      <!-- SVG grid lines — sized to match parent -->
      <svg
        class="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 900 1000"
        preserveAspectRatio="none"
      >
        <!-- Horizontal lines — all 10 ranks (pieces sit on intersections) -->
        <line
          v-for="r in 10"
          :key="'h-' + r"
          :x1="M"
          :y1="M + (r - 1) * S"
          :x2="M + 8 * S"
          :y2="M + (r - 1) * S"
          stroke="#8B7355"
          stroke-width="2"
        />
        <!-- Left edge vertical (file 0) -- full height -->
        <line :x1="M" :y1="M" :x2="M" :y2="M + 9 * S" stroke="#8B7355" stroke-width="2" />
        <!-- Right edge vertical (file 8) -- full height -->
        <line :x1="M + 8 * S" :y1="M" :x2="M + 8 * S" :y2="M + 9 * S" stroke="#8B7355" stroke-width="2" />
        <!-- Inner verticals — top half (black side, ranks 0-4) -->
        <line
          v-for="f in 7"
          :key="'vl-' + f"
          :x1="M + f * S"
          :y1="M"
          :x2="M + f * S"
          :y2="M + 4 * S"
          stroke="#8B7355"
          stroke-width="2"
        />
        <!-- Inner verticals — bottom half (red side, ranks 5-9) -->
        <line
          v-for="f in 7"
          :key="'vu-' + f"
          :x1="M + f * S"
          :y1="M + 5 * S"
          :x2="M + f * S"
          :y2="M + 9 * S"
          stroke="#8B7355"
          stroke-width="2"
        />
        <!-- Palace diagonals — black side (top, ranks 0-2) -->
        <line x1="M + 3 * S" :y1="M + 0 * S" x2="M + 5 * S" :y2="M + 2 * S" stroke="#8B7355" stroke-width="2" />
        <line x1="M + 5 * S" :y1="M + 0 * S" x2="M + 3 * S" :y2="M + 2 * S" stroke="#8B7355" stroke-width="2" />
        <!-- Palace diagonals — red side (bottom, ranks 7-9) -->
        <line x1="M + 3 * S" :y1="M + 7 * S" x2="M + 5 * S" :y2="M + 9 * S" stroke="#8B7355" stroke-width="2" />
        <line x1="M + 5 * S" :y1="M + 7 * S" x2="M + 3 * S" :y2="M + 9 * S" stroke="#8B7355" stroke-width="2" />
        <!-- Point dots -->
        <circle
          v-for="dot in DOT_POSITIONS"
          :key="'dot-' + dot.rank + '-' + dot.file"
          :cx="M + dot.file * S"
          :cy="M + dot.rank * S"
          r="5"
          fill="#8B7355"
        />
      </svg>

      <!-- River text -->
      <div
        class="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-10 select-none"
        :style="{ top: M + 4.5 * S + 'px', height: S + 'px', marginTop: -S / 2 + 'px', left: M + 'px', right: M + 'px' }"
      >
        <span class="text-3xl font-bold text-amber-800 tracking-[1em] opacity-40">
          楚河　　漢界
        </span>
      </div>

      <!-- Pieces grid — overlay on top -->
      <div
        class="absolute grid z-20"
        :style="{
          gridTemplateColumns: 'repeat(9, 1fr)',
          gridTemplateRows: 'repeat(10, 1fr)',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }"
      >
        <div
          v-for="cell in cells"
          :key="'cell-' + cell.rank + '-' + cell.file"
          class="flex items-center justify-center"
        >
          <Piece v-if="cell.piece" :piece="cell.piece" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.board-surface {
  background: #f0d9a0;
  border: 3px solid #8B7355;
  border-radius: 4px;
  max-width: 95vw;
  max-height: 95vh;
}
</style>
