<script setup lang="ts">
import { computed } from "vue"

const props = defineProps<{
  color: "red" | "black"
  label: string
  isActive: boolean
  isInCheck?: boolean
}>()
</script>

<template>
  <div
    class="px-4 py-3 rounded-lg border-2 transition-all"
    :class="{
      'border-yellow-400 bg-yellow-50 shadow-md': isActive,
      'border-gray-200 bg-gray-50 opacity-60': !isActive,
      'border-red-400 bg-red-50': isInCheck && isActive,
    }"
  >
    <div class="flex items-center gap-2">
      <div
        class="w-4 h-4 rounded-full"
        :class="color === 'red' ? 'bg-red-600' : 'bg-gray-900'"
      />
      <span class="font-medium" :class="color === 'red' ? 'text-red-700' : 'text-gray-900'">
        {{ label }}
      </span>
      <span v-if="isInCheck && isActive" class="ml-2 text-xs font-bold text-red-600 animate-pulse">
        CHECK!
      </span>
    </div>
  </div>
</template>
