<script setup lang="ts">
import { ref, watch, onMounted } from "vue"
import { useRouter } from "vue-router"
import RoomCard from "../components/RoomCard.vue"
import ThemeDropdown from "../components/ThemeDropdown.vue"
import { useWebSocket } from "../composables/useWebSocket"

interface RoomInfo {
  roomId: string
  playerA: string
  playerB: string | null
  status: string
  spectatorCount?: number
}

const rooms = ref<RoomInfo[]>([])
const playerName = ref(localStorage.getItem("playerName") || "")
const nameInput = ref(playerName.value)
const showNameInput = ref(!playerName.value)
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

// Send createRoom on first message that indicates connected
// We watch via the composable: on connected, send joinLobby
watch(status, (s) => {
  if (s === "connected") {
    send({ action: "joinLobby" })
    // Send saved name on connect
    if (playerName.value) {
      send({ action: "setName", name: playerName.value })
    }
  }
})

function createRoom() {
  send({ action: "createRoom" })
}

function joinRoom(roomId: string) {
  router.push(`/room/${roomId}`)
}

function watchRoom(roomId: string) {
  router.push({ path: `/room/${roomId}`, query: { spectate: "1" } })
}

function saveName() {
  const name = nameInput.value.trim().slice(0, 16)
  if (name) {
    playerName.value = name
    localStorage.setItem("playerName", name)
    send({ action: "setName", name })
    showNameInput.value = false
  }
}

function openNameInput() {
  nameInput.value = playerName.value
  showNameInput.value = true
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
    <div class="max-w-2xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Chinese Chess</h1>
          <ThemeDropdown />
        </div>
        <button
          @click="createRoom"
          :disabled="status !== 'connected'"
          class="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          + Create Room
        </button>
      </div>

      <!-- Player name section -->
      <div class="mb-4 flex items-center gap-2">
        <template v-if="showNameInput">
          <input
            v-model="nameInput"
            type="text"
            maxlength="16"
            placeholder="Enter your name"
            class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @keyup.enter="saveName"
          />
          <button
            @click="saveName"
            :disabled="!nameInput.trim()"
            class="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
          <button
            v-if="playerName"
            @click="showNameInput = false"
            class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Cancel
          </button>
        </template>
        <template v-else>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            Playing as: <span class="font-medium text-gray-800 dark:text-gray-200">{{ playerName || 'Anonymous' }}</span>
          </span>
          <button
            @click="openNameInput"
            class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Change
          </button>
        </template>
      </div>

      <div v-if="rooms.length === 0" class="text-center py-12 text-gray-400 dark:text-gray-500">
        <p class="text-lg">No open rooms</p>
        <p class="text-sm mt-1">Create one to start playing!</p>
      </div>

      <div v-else class="space-y-2">
        <RoomCard
          v-for="room in rooms"
          :key="room.roomId"
          :room-id="room.roomId"
          :player-count="room.playerB ? 2 : 1"
          :spectator-count="room.spectatorCount || 0"
          @join="joinRoom"
          @watch="watchRoom"
        />
      </div>
    </div>
  </div>
</template>