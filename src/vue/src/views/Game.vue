<script setup lang="ts">
import { shallowRef, ref, computed, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import Board from "../components/Board.vue"
import SidePanel from "../components/SidePanel.vue"
import ThemeDropdown from "../components/ThemeDropdown.vue"
import type { RoomPlayer } from "../components/SidePanel.vue"
import type { ChatMessage } from "../components/ChatPanel.vue"
import { useWebSocket } from "../composables/useWebSocket"
import { useBoard } from "../composables/useBoard"
import { useSound } from "../composables/useSound"
import type { BoardState } from "../composables/useBoard"

const route = useRoute()
const router = useRouter()
const roomId = route.params.id as string
const originalClientId = route.query.cid as string | undefined

const { board, turn, selectedPos, legalMoves, isLegalTarget, isCaptureTarget, handleCellClick, inCheckColor, setBoard, setTurn, setInCheck, clearSelection } = useBoard()

const gameStarted = shallowRef(false)
const gameOver = shallowRef(false)
const gameResult = shallowRef("")
const myColor = shallowRef<"red" | "black" | null>(null)
const myClientId = shallowRef<string | null>(null)
const error = shallowRef<string | null>(null)
const players = ref<RoomPlayer[]>([])
const chatMessages = ref<ChatMessage[]>([])
const drawOffered = shallowRef(false)
const pendingDrawOffer = shallowRef(false)
const countdownExpiresAt = shallowRef<number | null>(null)
const countdownRemaining = shallowRef(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const { playSound } = useSound()

const mode = computed<"pre-game" | "in-game" | "game-over">(() => {
  if (gameOver.value) return "game-over"
  if (gameStarted.value) return "in-game"
  return "pre-game"
})

const { clientId, status, send } = useWebSocket((data) => {
  if (data.type === "connected") {
    myClientId.value = data.clientId as string
  }

  if (data.type === "roomUpdate") {
    const msg = data as { players: RoomPlayer[] }
    players.value = msg.players
    // Set initial board if not yet started
    if (!gameStarted.value && !gameOver.value) {
      setBoard(createInitialBoard())
    }
  }

  if (data.type === "gameStart") {
    const msg = data as unknown as { yourColor: "red" | "black"; roomId: string }
    gameStarted.value = true
    myColor.value = msg.yourColor
  }

  if (data.type === "boardUpdate") {
    const msg = data as { board: BoardState; turn: "red" | "black"; moveCount: number; inCheck?: boolean; lastMove?: { from: { rank: number; file: number }; to: { rank: number; file: number } } }
    setBoard(msg.board)
    setTurn(msg.turn)
    setInCheck(msg.inCheck ? msg.turn : null)
    // Sound effects
    if (msg.inCheck) {
      playSound("check")
    } else {
      playSound("move")
    }
  }

  if (data.type === "gameEnd") {
    const msg = data as { result: string; winnerColor: string | null; reason: string; expiresAt?: number }
    gameOver.value = true
    gameResult.value = msg.reason
    if (msg.expiresAt) {
      countdownExpiresAt.value = msg.expiresAt
      countdownRemaining.value = Math.max(0, Math.ceil((msg.expiresAt - Date.now()) / 1000))
      if (countdownTimer) clearInterval(countdownTimer)
      countdownTimer = setInterval(() => {
        if (countdownExpiresAt.value && Date.now() >= countdownExpiresAt.value) {
          clearInterval(countdownTimer!)
          countdownTimer = null
          countdownRemaining.value = 0
          // Auto-rematch
          if (!gameStarted.value && !gameOver.value) {
            // Game state was already reset, don't rematch
          } else if (gameOver.value) {
            rematch()
          }
        } else {
          countdownRemaining.value = Math.max(0, Math.ceil((countdownExpiresAt.value! - Date.now()) / 1000))
        }
      }, 1000)
    }
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

  if (data.type === "kicked") {
    error.value = (data as { reason: string }).reason
    players.value = []
    gameStarted.value = false
    gameOver.value = false
  }

  if (data.type === "rematchState") {
    const msg = data as { acceptedA: boolean; acceptedB: boolean }
    // If both accepted, reset to pre-game
    if (msg.acceptedA && msg.acceptedB) {
      gameOver.value = false
      gameStarted.value = false
      myColor.value = null
      setBoard(createInitialBoard())
      clearCountdown()
    }
  }
})

function createInitialBoard(): BoardState {
  const board: BoardState = Array.from({ length: 10 }, () => Array(9).fill(null))
  board[0] = ["b車", "b馬", "b象", "b士", "b將", "b士", "b象", "b馬", "b車"]
  board[2]![1] = "b砲"
  board[2]![7] = "b砲"
  board[3]![0] = "b卒"
  board[3]![2] = "b卒"
  board[3]![4] = "b卒"
  board[3]![6] = "b卒"
  board[3]![8] = "b卒"
  board[9] = ["r車", "r馬", "r象", "r士", "r帥", "r士", "r象", "r馬", "r車"]
  board[7]![1] = "r炮"
  board[7]![7] = "r炮"
  board[6]![0] = "r兵"
  board[6]![2] = "r兵"
  board[6]![4] = "r兵"
  board[6]![6] = "r兵"
  board[6]![8] = "r兵"
  return board
}

// Wait for both connected AND clientId to be set before sending room actions
watch([status, clientId], ([s, cid]) => {
  if (s === "connected" && cid && roomId) {
    if (originalClientId) {
      // Came from Lobby after creating room — reclaim our original player slot
      send({ action: "reclaimRoom", roomId, originalClientId })
    } else {
      // Fresh join from lobby click or bookmark
      send({ action: "joinRoom", roomId })
    }
  }
})

function onCellClick(rank: number, file: number) {
  if (gameOver.value || !gameStarted.value) return
  const move = handleCellClick(rank, file)
  if (move) {
    send({ action: "move", roomId, from: move.from, to: move.to })
  }
}

function toggleReady() {
  send({ action: "toggleReady", roomId })
}

function backToLobby() {
  send({ action: "leaveRoom" })
  clearCountdown()
  router.push("/")
}

function kick() {
  send({ action: "kickPlayer", roomId })
}

function rematch() {
  send({ action: "rematch", roomId })
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  countdownExpiresAt.value = null
  countdownRemaining.value = 0
}

function clearCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  countdownExpiresAt.value = null
  countdownRemaining.value = 0
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
  drawOffered.value = false
}

function declineDraw() {
  send({ type: "drawDecline", roomId })
  pendingDrawOffer.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 p-2 md:p-4">
    <!-- Error state -->
    <div v-if="error && !gameStarted && players.length === 0" class="max-w-md mx-auto text-center">
      <div class="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
        <p class="text-red-700 dark:text-red-300">{{ error }}</p>
        <button @click="backToLobby" class="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">Back to Lobby</button>
      </div>
    </div>

    <template v-else>
      <!-- Room header -->
      <div class="flex items-center justify-between mb-3 px-2">
        <h1 class="text-lg font-bold text-gray-800 dark:text-gray-100">
          Room: <span class="font-mono text-sm">{{ roomId }}</span>
        </h1>
        <ThemeDropdown />
      </div>

      <!-- Board + Side Panel layout -->
      <div class="flex flex-col md:flex-row gap-4 items-start justify-center">
        <!-- Board -->
        <div class="flex flex-col items-center self-center md:self-start">
          <Board
            :board="board"
            :flipped="myColor === 'black'"
            :selected-pos="selectedPos"
            :legal-moves="legalMoves"
            :is-legal-target="isLegalTarget"
            :is-capture-target="isCaptureTarget"
            :in-check-color="inCheckColor"
            :class="{ 'pointer-events-none': !gameStarted || gameOver }"
            @cell-click="onCellClick"
          />
        </div>

        <!-- Side Panel -->
        <SidePanel
          class="self-center md:self-start"
          :mode="mode"
          :players="players"
          :my-client-id="myClientId"
          :my-color="myColor"
          :turn="turn"
          :in-check-color="inCheckColor"
          :game-result="gameResult"
          :chat-messages="chatMessages"
          :chat-disabled="gameOver"
          :countdown-remaining="countdownRemaining"
          @toggle-ready="toggleReady"
          @send-chat="sendChat"
          @resign="resign"
          @offer-draw="offerDraw"
          @back-to-lobby="backToLobby"
          @kick="kick"
          @rematch="rematch"
        />
      </div>

      <!-- Draw offer notification -->
      <div v-if="pendingDrawOffer" class="fixed bottom-4 right-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-300 dark:border-yellow-800 rounded-lg px-4 py-2 flex items-center gap-3 shadow-lg z-50">
        <span class="text-sm text-yellow-800 dark:text-yellow-200">Opponent offers a draw</span>
        <button @click="acceptDraw" class="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 dark:hover:bg-green-800">Accept</button>
        <button @click="declineDraw" class="text-sm px-3 py-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600">Decline</button>
      </div>
    </template>
  </div>
</template>
