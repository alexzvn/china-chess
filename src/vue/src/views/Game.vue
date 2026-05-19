<script setup lang="ts">
import { shallowRef, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import Board from "../components/Board.vue"
import PlayerInfo from "../components/PlayerInfo.vue"
import ChatPanel from "../components/ChatPanel.vue"
import type { ChatMessage } from "../components/ChatPanel.vue"
import { useWebSocket } from "../composables/useWebSocket"
import { useBoard } from "../composables/useBoard"
import type { BoardState } from "../composables/useBoard"

const route = useRoute()
const router = useRouter()
const roomId = route.params.id as string

const { board, turn, selectedPos, legalMoves, isLegalTarget, isCaptureTarget, handleCellClick, inCheckColor, setBoard, setTurn, setInCheck, clearSelection } = useBoard()

const joined = shallowRef(false)
const gameStarted = shallowRef(false)
const gameOver = shallowRef(false)
const gameResult = shallowRef("")
const myColor = shallowRef<"red" | "black" | null>(null)
const error = shallowRef<string | null>(null)
const chatMessages = ref<ChatMessage[]>([])
const drawOffered = shallowRef(false)
const pendingDrawOffer = shallowRef(false)

const { status, send } = useWebSocket((data) => {
  if (data.type === "roomJoined") {
    joined.value = true
  }

  if (data.type === "gameStart") {
    const msg = data as unknown as { yourColor: "red" | "black"; roomId: string }
    gameStarted.value = true
    myColor.value = msg.yourColor
  }

  if (data.type === "boardUpdate") {
    const msg = data as { board: BoardState; turn: "red" | "black"; moveCount: number; inCheck?: boolean }
    setBoard(msg.board)
    setTurn(msg.turn)
    setInCheck(msg.inCheck ? msg.turn : null)
  }

  if (data.type === "gameEnd") {
    const msg = data as { result: string; winnerColor: string | null; reason: string }
    gameOver.value = true
    gameResult.value = msg.reason
  }

  if (data.type === "chat") {
    const msg = data as { message: ChatMessage }
    chatMessages.value.push(msg.message)
  }

  if (data.type === "drawOffered") {
    pendingDrawOffer.value = true
  }

  if (data.type === "drawDeclined") {
    drawOffered.value = false
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

function onCellClick(rank: number, file: number) {
  if (gameOver.value) return
  const move = handleCellClick(rank, file)
  if (move && gameStarted.value) {
    send({ action: "move", roomId, from: move.from, to: move.to })
  }
}

function confirmStart() {
  send({ action: "startGame", roomId })
}

function backToLobby() {
  send({ action: "leaveRoom" })
  router.push("/")
}

function sendChat(text: string) {
  send({ type: "chat", roomId, text })
}

function resign() {
  send({ action: "resign", roomId })
}

function offerDraw() {
  send({ type: "drawOffer", roomId })
  drawOffered.value = true
}

function acceptDraw() {
  send({ type: "drawAccept", roomId })
  pendingDrawOffer.value = false
}

function declineDraw() {
  send({ type: "drawDecline", roomId })
  pendingDrawOffer.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center p-2 md:p-4">
    <div v-if="error && !gameStarted" class="max-w-md w-full text-center">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p class="text-red-700">{{ error }}</p>
        <button @click="backToLobby" class="mt-3 text-sm text-blue-600 hover:underline">Back to Lobby</button>
      </div>
    </div>

    <div v-else class="flex flex-col items-center gap-3 w-full max-w-full">
      <div class="text-center">
        <h1 class="text-lg font-bold text-gray-800">
          Room: <span class="font-mono text-sm">{{ roomId }}</span>
        </h1>
      </div>

      <!-- Pre-game start -->
      <div v-if="!gameStarted && !gameOver" class="flex gap-4 items-center">
        <p class="text-sm text-gray-500">Waiting for players...</p>
        <button v-if="joined" @click="confirmStart" class="px-5 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors text-sm">Start Game</button>
      </div>

      <!-- Game area -->
      <div v-if="gameStarted" class="flex gap-4 items-start">
        <div class="flex flex-col items-center gap-2">
          <PlayerInfo color="black" label="Black" :is-active="turn === 'black'" :is-in-check="inCheckColor === 'black'" />
          <Board
            :board="board"
            :selected-pos="selectedPos"
            :legal-moves="legalMoves"
            :is-legal-target="isLegalTarget"
            :is-capture-target="isCaptureTarget"
            :in-check-color="inCheckColor"
            :class="{ 'pointer-events-none': gameOver }"
            @cell-click="onCellClick"
          />
          <PlayerInfo color="red" label="Red" :is-active="turn === 'red'" :is-in-check="inCheckColor === 'red'" />
        </div>
        <ChatPanel :messages="chatMessages" :disabled="gameOver" @send="sendChat" />
      </div>

      <!-- Draw offer notification -->
      <div v-if="pendingDrawOffer" class="bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-2 flex items-center gap-3">
        <span class="text-sm text-yellow-800">Opponent offers a draw</span>
        <button @click="acceptDraw" class="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Accept</button>
        <button @click="declineDraw" class="text-sm px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Decline</button>
      </div>

      <!-- In-game action buttons -->
      <div v-if="gameStarted && !gameOver" class="flex gap-3">
        <button @click="resign" class="text-sm px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">Resign</button>
        <button @click="offerDraw" :disabled="drawOffered" class="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
          {{ drawOffered ? "Draw Offered" : "Offer Draw" }}
        </button>
      </div>

      <!-- Game over status bar -->
      <div v-if="gameOver" class="bg-gray-800 text-white px-6 py-3 rounded-lg text-center">
        <p class="font-bold">{{ gameResult }}</p>
        <button @click="backToLobby" class="mt-2 text-sm text-blue-300 hover:text-blue-200 underline">Back to Lobby</button>
      </div>

      <button v-if="!gameStarted" @click="backToLobby" class="text-sm text-gray-500 hover:text-gray-700 underline">Back to Lobby</button>
    </div>
  </div>
</template>
