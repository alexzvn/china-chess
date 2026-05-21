<script setup lang="ts">
import { computed } from "vue"
import Piece from "./Piece.vue"
import type { BoardState, Position } from "../composables/useBoard"

const props = defineProps<{
  board: BoardState
  flipped?: boolean
  selectedPos?: { rank: number; file: number } | null
  legalMoves?: { rank: number; file: number }[]
  isLegalTarget?: (rank: number, file: number) => boolean
  isCaptureTarget?: (rank: number, file: number) => boolean
  inCheckColor?: "red" | "black" | null
  lastMove?: { from: Position; to: Position } | null
}>()

const emit = defineEmits<{
  cellClick: [rank: number, file: number]
}>()

interface CellPos {
  rank: number
  file: number
  piece: string | null
}

const cells = computed<CellPos[]>(() => {
  const result: CellPos[] = []
  if (props.flipped) {
    for (let rank = 9; rank >= 0; rank--) {
      for (let file = 8; file >= 0; file--) {
        result.push({
          rank,
          file,
          piece: props.board[rank]![file] ?? null,
        })
      }
    }
  } else {
    for (let rank = 0; rank < 10; rank++) {
      for (let file = 0; file < 9; file++) {
        result.push({
          rank,
          file,
          piece: props.board[rank]![file] ?? null,
        })
      }
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

function isSelected(rank: number, file: number): boolean {
  return props.selectedPos?.rank === rank && props.selectedPos?.file === file
}

function isCheckKing(piece: string | null): boolean {
  if (!piece || !props.inCheckColor) return false
  const color = piece.startsWith("r") ? "red" : "black"
  const type = piece.slice(1)
  return color === props.inCheckColor && (type === "帥" || type === "將")
}

const M = 50
const S = 100
const sx = (file: number) => M + (props.flipped ? 8 - file : file) * S
const sy = (rank: number) => M + (props.flipped ? 9 - rank : rank) * S
</script>

<template>
  <div class="board-wrapper inline-block">
    <div class="board-surface relative overflow-hidden" :style="{ width: 'min(90vmin, 560px)', height: 'min(100vmin, 622px)' }">
      <!-- SVG grid lines -->
      <svg
        class="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 900 1000"
        preserveAspectRatio="none"
      >
        <!-- Horizontal lines -->
        <line v-for="r in 10" :key="'h-' + r" :x1="sx(0)" :y1="sy(r - 1)" :x2="sx(8)" :y2="sy(r - 1)" stroke="#8B7355" class="dark:stroke-gray-500" stroke-width="2" />
        <!-- Edges -->
        <line :x1="sx(0)" :y1="sy(0)" :x2="sx(0)" :y2="sy(9)" stroke="#8B7355" class="dark:stroke-gray-500" stroke-width="2" />
        <line :x1="sx(8)" :y1="sy(0)" :x2="sx(8)" :y2="sy(9)" stroke="#8B7355" class="dark:stroke-gray-500" stroke-width="2" />
        <!-- Inner verticals — top half -->
        <line v-for="f in 7" :key="'vl-' + f" :x1="sx(f)" :y1="sy(0)" :x2="sx(f)" :y2="sy(4)" stroke="#8B7355" class="dark:stroke-gray-500" stroke-width="2" />
        <!-- Inner verticals — bottom half -->
        <line v-for="f in 7" :key="'vu-' + f" :x1="sx(f)" :y1="sy(5)" :x2="sx(f)" :y2="sy(9)" stroke="#8B7355" class="dark:stroke-gray-500" stroke-width="2" />
        <!-- Palace diagonals -->
        <line :x1="sx(3)" :y1="sy(0)" :x2="sx(5)" :y2="sy(2)" stroke="#8B7355" class="dark:stroke-gray-500" stroke-width="2" />
        <line :x1="sx(5)" :y1="sy(0)" :x2="sx(3)" :y2="sy(2)" stroke="#8B7355" class="dark:stroke-gray-500" stroke-width="2" />
        <line :x1="sx(3)" :y1="sy(7)" :x2="sx(5)" :y2="sy(9)" stroke="#8B7355" class="dark:stroke-gray-500" stroke-width="2" />
        <line :x1="sx(5)" :y1="sy(7)" :x2="sx(3)" :y2="sy(9)" stroke="#8B7355" class="dark:stroke-gray-500" stroke-width="2" />
        <!-- Point dots -->
        <circle v-for="dot in DOT_POSITIONS" :key="'dot-' + dot.rank + '-' + dot.file" :cx="sx(dot.file)" :cy="sy(dot.rank)" r="5" fill="#8B7355" class="dark:fill-gray-500" />
      </svg>

      <!-- River text -->
      <div class="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-10 select-none" :style="{ top: M + 4.5 * S + 'px', height: S + 'px', marginTop: -S / 2 + 'px', left: M + 'px', right: M + 'px' }">
        <span class="text-3xl font-bold text-amber-800 dark:text-amber-400 tracking-[1em] opacity-40">楚河 漢界</span>
      </div>

      <!-- Pieces grid -->
      <div
        class="absolute grid z-20"
        :style="{
          gridTemplateColumns: 'repeat(9, 1fr)',
          gridTemplateRows: 'repeat(10, 1fr)',
          top: 0, left: 0, width: '100%', height: '100%',
        }"
      >
        <div
          v-for="cell in cells"
          :key="'cell-' + cell.rank + '-' + cell.file"
          class="flex items-center justify-center relative cursor-pointer"
          @click="emit('cellClick', cell.rank, cell.file)"
        >
          <!-- Last move "from" highlight (small dot) -->
          <div
            v-if="props.lastMove && cell.rank === props.lastMove.from.rank && cell.file === props.lastMove.from.file"
            class="absolute inset-[35%] rounded-full border-3 border-amber-700/40 dark:border-amber-400/40 pointer-events-none z-[1]"
          />

          <!-- Last move "to" highlight (outer ring) -->
          <div
            v-if="props.lastMove && cell.rank === props.lastMove.to.rank && cell.file === props.lastMove.to.file"
            class="absolute inset-[5%] rounded-full border-3 border-amber-700/50 dark:border-amber-400/50 pointer-events-none z-[1]"
          />

          <!-- Selected piece highlight -->
          <div
            v-if="isSelected(cell.rank, cell.file)"
            class="absolute inset-0 rounded-full border-4 border-yellow-400 dark:border-yellow-300 animate-pulse pointer-events-none z-10"
          />

          <!-- Legal move: empty target → dot -->
          <div
            v-if="props.isLegalTarget?.(cell.rank, cell.file) && !props.isCaptureTarget?.(cell.rank, cell.file)"
            class="absolute w-[20%] h-[20%] rounded-full bg-green-500 dark:bg-green-400 opacity-70 pointer-events-none z-10"
          />

          <!-- Legal move: capture target → ring -->
          <div
            v-if="props.isCaptureTarget?.(cell.rank, cell.file)"
            class="absolute inset-[10%] rounded-full border-3 border-red-500 dark:border-red-400 opacity-80 pointer-events-none z-10"
          />

          <Piece
            v-if="cell.piece"
            :piece="cell.piece"
            :selected="isSelected(cell.rank, cell.file)"
            :in-check="isCheckKing(cell.piece)"
          />
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

.dark .board-surface {
  background: #5c3d2e;
  border-color: #a08060;
}
</style>
