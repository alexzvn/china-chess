<script setup lang="ts">
const props = defineProps<{
  roomId: string
  playerCount: number
  spectatorCount?: number
}>()

const emit = defineEmits<{
  join: [roomId: string]
  watch: [roomId: string]
}>()

function onJoin() {
  emit("join", props.roomId)
}

function onWatch(e: MouseEvent) {
  e.stopPropagation()
  emit("watch", props.roomId)
}
</script>

<template>
  <div
    class="border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 flex items-center justify-between hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
    @click="onJoin"
  >
    <div>
      <span class="font-mono text-sm text-gray-500 dark:text-gray-400">Room</span>
      <span class="ml-2 font-mono font-bold text-gray-800 dark:text-gray-100">{{ roomId }}</span>
    </div>
    <div class="flex items-center gap-2">
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {{ playerCount }} / 2 players
        <span v-if="spectatorCount && spectatorCount > 0" class="ml-1 text-xs text-gray-400">
          + {{ spectatorCount }} watching
        </span>
      </div>
      <button
        @click="onWatch"
        class="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        Watch
      </button>
    </div>
  </div>
</template>
