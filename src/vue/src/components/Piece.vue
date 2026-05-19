<script setup lang="ts">
import { computed } from "vue"

const props = defineProps<{
  piece: string
  selected?: boolean
  inCheck?: boolean
}>()

const isRed = computed(() => props.piece.startsWith("r"))
const char = computed(() => props.piece.slice(1))
</script>

<template>
  <div
    class="piece flex items-center justify-center rounded-full select-none"
    :class="[
      isRed ? 'text-red-700 dark:text-red-500' : 'text-gray-900 dark:text-gray-100',
      selected ? 'ring-2 ring-yellow-400 dark:ring-yellow-300 ring-offset-1 dark:ring-offset-gray-900' : '',
      inCheck ? 'ring-2 ring-red-500 dark:ring-red-400 shadow-lg shadow-red-500/50 dark:shadow-red-400/50' : '',
    ]"
  >
    <div
      class="piece-inner flex items-center justify-center rounded-full"
      :class="isRed ? 'bg-amber-50 dark:bg-red-950 border-red-700 dark:border-red-500' : 'bg-amber-100 dark:bg-gray-800 border-gray-900 dark:border-gray-400'"
    >
      <span class="piece-char font-bold leading-none">{{ char }}</span>
    </div>
  </div>
</template>

<style scoped>
.piece {
  width: 88%;
  height: 88%;
  background: radial-gradient(circle, #f5e6c8 0%, #e8d5a8 100%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.dark .piece {
  background: radial-gradient(circle, #4a3728 0%, #3a2a1e 100%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.piece-inner {
  width: 85%;
  height: 85%;
  border: 2px solid;
}

.piece-char {
  font-size: clamp(14px, 3.5vmin, 28px);
}
</style>
