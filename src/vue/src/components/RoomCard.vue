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
    class="border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
    @click="emit('join', props.roomId)"
  >
    <div>
      <span class="font-mono text-sm text-gray-500">Room</span>
      <span class="ml-2 font-mono font-bold text-gray-800">{{ roomId }}</span>
    </div>
    <div class="text-sm text-gray-500">
      {{ playerCount }} / 2 players
    </div>
  </div>
</template>
