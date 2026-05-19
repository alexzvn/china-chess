<script setup lang="ts">
import { shallowRef } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useWebSocket } from "../composables/useWebSocket"

const route = useRoute()
const router = useRouter()
const roomId = route.params.id as string

interface RoomJoinedData {
  type: "roomJoined"
  roomId: string
  player: "A" | "B"
}

interface GameStartData {
  type: "gameStart"
  yourColor: "red" | "black"
  roomId: string
}

const joined = shallowRef(false)
const gameStarted = shallowRef(false)
const myColor = shallowRef<"red" | "black" | null>(null)
const playerLabel = shallowRef<"A" | "B" | null>(null)
const error = shallowRef<string | null>(null)

const { status, send } = useWebSocket((data) => {
  if (data.type === "roomJoined") {
    const msg = data as unknown as RoomJoinedData
    joined.value = true
    playerLabel.value = msg.player
  }

  if (data.type === "gameStart") {
    const msg = data as unknown as GameStartData
    gameStarted.value = true
    myColor.value = msg.yourColor
  }

  if (data.type === "error") {
    error.value = (data as { message: string }).message
  }
})

// Watch for connected status to send joinRoom
import { watch } from "vue"

watch(status, (s) => {
  if (s === "connected" && roomId) {
    send({ action: "joinRoom", roomId })
  }
})

function confirmStart() {
  send({ action: "startGame", roomId })
}

function backToLobby() {
  router.push("/")
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full text-center">
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p class="text-red-700">{{ error }}</p>
        <button
          @click="backToLobby"
          class="mt-3 text-sm text-blue-600 hover:underline"
        >
          Back to Lobby
        </button>
      </div>

      <div v-else-if="!gameStarted">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Room: {{ roomId }}</h1>
        <p class="text-sm text-gray-500 mb-6">
          {{ status === "connected" ? "Connected" : "Connecting..." }}
        </p>

        <div
          v-if="joined"
          class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
        >
          <p class="text-gray-700 mb-2">
            You are <strong>Player {{ playerLabel }}</strong>
          </p>
          <p class="text-sm text-gray-500 mb-4">
            Waiting for both players to start...
          </p>
          <button
            @click="confirmStart"
            class="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Start Game
          </button>
        </div>

        <div v-else class="text-gray-400">
          <p>Joining room...</p>
        </div>
      </div>

      <div v-else class="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <h2 class="text-xl font-bold text-gray-800 mb-3">Game Started!</h2>
        <p class="text-lg">
          You are
          <span
            :class="myColor === 'red' ? 'text-red-600' : 'text-gray-900'"
            class="font-bold"
          >
            {{ myColor === "red" ? "Red" : "Black" }}
          </span>
        </p>
        <p class="text-sm text-gray-500 mt-2">Red moves first</p>
      </div>
    </div>
  </div>
</template>
