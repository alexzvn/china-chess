<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import RoomCard from "../components/RoomCard.vue"

interface RoomInfo {
  roomId: string
  playerA: string
  playerB: string | null
  status: string
}

const rooms = ref<RoomInfo[]>([])
const clientId = ref<string | null>(null)
const statusText = ref("Connecting...")
let ws: WebSocket | null = null

function connect() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  const host = import.meta.env.DEV ? "localhost:3000" : window.location.host
  ws = new WebSocket(`${protocol}//${host}/ws`)

  ws.onopen = () => {
    statusText.value = "Connected"
    ws!.send(JSON.stringify({ action: "joinLobby" }))
  }

  ws.onmessage = (e: MessageEvent) => {
    const data = JSON.parse(e.data)
    if (data.type === "connected") {
      clientId.value = data.clientId
    } else if (data.type === "lobbyUpdate") {
      rooms.value = data.rooms
    } else if (data.type === "roomCreated") {
      // Will receive lobbyUpdate via broadcast
    }
  }

  ws.onclose = () => {
    statusText.value = "Disconnected"
  }

  ws.onerror = () => {
    statusText.value = "Connection error"
  }
}

function createRoom() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ action: "createRoom" }))
  }
}

onMounted(connect)
onUnmounted(() => {
  ws?.close()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-4 md:p-8">
    <div class="max-w-2xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Chinese Chess</h1>
          <p
            class="text-sm mt-1"
            :class="{
              'text-green-600': statusText === 'Connected',
              'text-yellow-600': statusText === 'Connecting...',
              'text-red-600': statusText.startsWith('Disconnected') || statusText === 'Connection error',
            }"
          >
            {{ statusText }}
          </p>
        </div>
        <button
          @click="createRoom"
          :disabled="!ws || ws.readyState !== WebSocket.OPEN"
          class="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          + Create Room
        </button>
      </div>

      <div v-if="rooms.length === 0" class="text-center py-12 text-gray-400">
        <p class="text-lg">No open rooms</p>
        <p class="text-sm mt-1">Create one to start playing!</p>
      </div>

      <div v-else class="space-y-2">
        <RoomCard
          v-for="room in rooms"
          :key="room.roomId"
          :room-id="room.roomId"
          :player-count="room.playerB ? 2 : 1"
        />
      </div>
    </div>
  </div>
</template>
