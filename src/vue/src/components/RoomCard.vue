<script setup lang="ts">
const props = defineProps<{
  roomId: string
  playerCount: number
}>()

const emit = defineEmits<{
  join: [roomId: string]
}>()
</script>

<template>
  <div
    class="border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 flex items-center justify-between hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
    @click="emit('join', props.roomId)"
  >
    <div>
      <span class="font-mono text-sm text-gray-500 dark:text-gray-400">Room</span>
      <span class="ml-2 font-mono font-bold text-gray-800 dark:text-gray-100">{{ roomId }}</span>
    </div>
    <div class="text-sm text-gray-500 dark:text-gray-400">
      {{ playerCount }} / 2 players
    </div>
  </div>
</template>
