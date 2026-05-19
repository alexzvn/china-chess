<script setup lang="ts">
import { shallowRef, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import Board from "../components/Board.vue"
import { useWebSocket } from "../composables/useWebSocket"
import { useBoard } from "../composables/useBoard"
import type { BoardState } from "../composables/useBoard"

const route = useRoute()
const router = useRouter()
const roomId = route.params.id as string

const { board, turn, selectedPos, legalMoves, isLegalTarget, isCaptureTarget, handleCellClick, setBoard, setTurn } = useBoard()

interface GameStartData {
  type: "gameStart"
  yourColor: "red" | "black"
  roomId: string
}

const joined = shallowRef(false)
const gameStarted = shallowRef(false)
const myColor = shallowRef<"red" | "black" | null>(null)
const error = shallowRef<string | null>(null)

const { status, send } = useWebSocket((data) => {
  if (data.type === "roomJoined") {
    joined.value = true
  }

  if (data.type === "gameStart") {
    const msg = data as unknown as GameStartData
    gameStarted.value = true
    myColor.value = msg.yourColor
  }

  if (data.type === "boardUpdate") {
    const msg = data as { board: BoardState; turn: "red" | "black"; moveCount: number }
    setBoard(msg.board)
    setTurn(msg.turn)
  }

  if (data.type === "error") {
    error.value = (data as { message: string }).message
  }

  if (data.type === "error") {
    error.value = (data as { message: string }).message
  }
})

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

function onCellClick(rank: number, file: number) {
  const move = handleCellClick(rank, file)
  if (move && gameStarted.value) {
    send({ action: "move", roomId, from: move.from, to: move.to })
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center p-4">
    <div v-if="error" class="max-w-md w-full text-center">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p class="text-red-700">{{ error }}</p>
        <button @click="backToLobby" class="mt-3 text-sm text-blue-600 hover:underline">Back to Lobby</button>
      </div>
    </div>

    <div v-else class="flex flex-col items-center gap-4">
      <div class="text-center">
        <h1 class="text-xl font-bold text-gray-800">
          Room: <span class="font-mono">{{ roomId }}</span>
        </h1>
        <p v-if="!gameStarted" class="text-sm mt-1" :class="{
          'text-green-600': status === 'connected',
          'text-yellow-600': status === 'connecting',
          'text-red-600': status === 'error',
        }">
          {{ status === "connected" ? "Connected — waiting for players..." : status }}
        </p>
      </div>

      <div v-if="!gameStarted && joined" class="flex gap-4 items-center bg-white border border-gray-200 rounded-lg px-6 py-3 shadow-sm">
        <p class="text-gray-700">Both players ready?</p>
        <button @click="confirmStart" class="px-5 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">Start Game</button>
      </div>

      <div v-if="gameStarted" class="px-4 py-2 rounded-lg text-sm font-medium" :class="myColor === 'red' ? 'bg-red-50 text-red-700' : 'bg-gray-800 text-white'">
        You are {{ myColor === "red" ? "Red" : "Black" }}
        <span v-if="myColor === 'red'" class="text-gray-400 ml-2">Red moves first</span>
      </div>

      <Board
        :board="board"
        :selected-pos="selectedPos"
        :legal-moves="legalMoves"
        :is-legal-target="isLegalTarget"
        :is-capture-target="isCaptureTarget"
        @cell-click="onCellClick"
      />

      <button @click="backToLobby" class="mt-2 text-sm text-gray-500 hover:text-gray-700 underline">Back to Lobby</button>
    </div>
  </div>
</template>
