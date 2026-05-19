<script setup lang="ts">
import { ref, watch } from "vue"
import { useRouter } from "vue-router"
import RoomCard from "../components/RoomCard.vue"
import { useWebSocket } from "../composables/useWebSocket"

interface RoomInfo {
  roomId: string
  playerA: string
  playerB: string | null
  status: string
}

const rooms = ref<RoomInfo[]>([])
const router = useRouter()

const { clientId, status, send } = useWebSocket((data) => {
  if (data.type === "roomCreated") {
    const roomId = data.roomId as string
    router.push({ path: `/room/${roomId}`, query: { cid: clientId.value ?? undefined } })
  }
  if (data.type === "lobbyUpdate") {
    rooms.value = data.rooms as RoomInfo[]
  }
})

// Join lobby as soon as connected
function handleConnected() {
  send({ action: "joinLobby" })
}

// Send createRoom on first message that indicates connected
// We watch via the composable: on connected, send joinLobby
// Actually, let's send joinLobby from within the connect handler
// For now, send it on mount via a watcher
watch(status, (s) => {
  if (s === "connected") {
    send({ action: "joinLobby" })
  }
})

function createRoom() {
  send({ action: "createRoom" })
}

function joinRoom(roomId: string) {
  router.push(`/room/${roomId}`)
}
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
              'text-green-600': status === 'connected',
              'text-yellow-600': status === 'connecting',
              'text-red-600': status === 'error' || status === 'disconnected',
            }"
          >
            {{ status === "connected" ? `Connected: ${clientId}` : status === "connecting" ? "Connecting..." : "Disconnected" }}
          </p>
        </div>
        <button
          @click="createRoom"
          :disabled="status !== 'connected'"
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
          @join="joinRoom"
        />
      </div>
    </div>
  </div>
</template>
