<script setup lang="ts">
import ChatPanel from "./ChatPanel.vue"
import type { ChatMessage } from "./ChatPanel.vue"

export interface RoomPlayer {
  clientId: string
  ready: boolean
  name: string
}

const props = defineProps<{
  mode: "pre-game" | "in-game" | "game-over"
  players: RoomPlayer[]
  myClientId: string | null
  myColor?: "red" | "black" | null
  turn?: "red" | "black"
  inCheckColor?: "red" | "black" | null
  gameResult?: string
  chatMessages: ChatMessage[]
  chatDisabled: boolean
  countdownRemaining?: number
}>()

const emit = defineEmits<{
  toggleReady: []
  sendChat: [text: string]
  resign: []
  offerDraw: []
  acceptDraw: []
  declineDraw: []
  backToLobby: []
  kick: []
  rematch: []
}>()

function playerLabel(player: { clientId: string; name: string }): string {
  if (player.clientId === props.myClientId) return "You"
  return player.name || `Player ${player.clientId.slice(0, 5)}`
}

function isHost(): boolean {
  return props.players.length > 0 && props.players[0]!.clientId === props.myClientId
}

function hasOpponent(): boolean {
  return props.players.length >= 2
}
</script>

<template>
  <div class="flex flex-col gap-3 w-full md:w-64">
    <!-- Pre-game: player list + ready button -->
    <template v-if="mode === 'pre-game'">
      <div class="border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
        <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          Players
        </div>
        <div class="p-3 space-y-2">
          <div
            v-for="p in players"
            :key="p.clientId"
            class="flex items-center justify-between py-1"
          >
            <span class="text-sm font-medium text-gray-800 dark:text-gray-200">
              {{ playerLabel(p) }}
            </span>
            <div class="flex items-center gap-2">
              <span
                class="text-xs px-2 py-0.5 rounded-full font-semibold"
                :class="p.ready ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'"
              >
                {{ p.ready ? "Ready ✓" : "Not Ready" }}
              </span>
              <button
                v-if="isHost() && !p.ready && p.clientId !== myClientId"
                @click="emit('kick')"
                class="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
              >
                Kick
              </button>
            </div>
          </div>
          <!-- Placeholder if waiting for opponent -->
          <div v-if="players.length < 2" class="flex items-center justify-between py-1">
            <span class="text-sm text-gray-400 dark:text-gray-500 italic">Waiting for opponent...</span>
          </div>
        </div>
        <div class="px-3 pb-3">
          <button
            v-if="players.some((p) => p.clientId === myClientId)"
            @click="emit('toggleReady')"
            class="w-full px-4 py-2 text-sm font-medium rounded-lg transition-all"
            :class="
              players.find((p) => p.clientId === myClientId)?.ready
                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                : 'bg-green-600 text-white hover:bg-green-700 dark:hover:bg-green-800'
            "
            :disabled="players.length < 2"
          >
            <template v-if="players.find((p) => p.clientId === myClientId)?.ready">
              {{ players.length < 2 ? "Waiting..." : "Waiting for opponent..." }}
            </template>
            <template v-else>
              Ready
            </template>
          </button>
        </div>
      </div>
    </template>

    <!-- In-game: player info with turn/check -->
    <template v-else-if="mode === 'in-game' || mode === 'game-over'">
      <div class="border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
        <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          Game Info
        </div>
        <div class="p-3 space-y-2">
          <!-- My info -->
          <div
            class="px-3 py-2 rounded-lg border-2 transition-all"
            :class="{
              'border-yellow-400 dark:border-yellow-500 bg-yellow-50 dark:bg-yellow-950 shadow-sm': turn === myColor,
              'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60': turn !== myColor,
              'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-950': inCheckColor === myColor,
            }"
          >
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full shrink-0" :class="myColor === 'red' ? 'bg-red-600' : 'bg-gray-900'" />
              <span class="text-sm font-medium text-gray-800 dark:text-gray-200">You ({{ myColor === 'red' ? 'Red' : 'Black' }})</span>
              <span v-if="inCheckColor === myColor" class="ml-auto text-xs font-bold text-red-600 dark:text-red-400 animate-pulse">CHECK!</span>
            </div>
          </div>
          <!-- Opponent info -->
          <div
            class="px-3 py-2 rounded-lg border-2 transition-all"
            :class="{
              'border-yellow-400 dark:border-yellow-500 bg-yellow-50 dark:bg-yellow-950 shadow-sm': turn !== myColor,
              'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60': turn === myColor,
              'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-950': inCheckColor !== myColor && inCheckColor !== null,
            }"
          >
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full shrink-0" :class="myColor === 'red' ? 'bg-gray-900' : 'bg-red-600'" />
              <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Opponent ({{ myColor === 'red' ? 'Black' : 'Red' }})</span>
              <span v-if="inCheckColor !== null && inCheckColor !== myColor" class="ml-auto text-xs font-bold text-red-600 dark:text-red-400 animate-pulse">CHECK!</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Game over banner -->
      <div v-if="mode === 'game-over'" class="bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-100 px-4 py-3 rounded-lg text-center">
        <p class="text-sm font-bold">{{ gameResult }}</p>
        <div v-if="countdownRemaining !== undefined && countdownRemaining > 0" class="mt-1 text-xs text-gray-300 dark:text-gray-400">
          New game in <span class="font-mono font-bold">{{ String(Math.floor(countdownRemaining / 60)).padStart(2, '0') }}:{{ String(countdownRemaining % 60).padStart(2, '0') }}</span>
        </div>
        <div class="mt-2 flex gap-2 justify-center">
          <button @click="emit('rematch')" class="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 dark:hover:bg-green-800 transition-colors">
            Rematch
          </button>
          <button @click="emit('backToLobby')" class="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
            Back to Lobby
          </button>
        </div>
      </div>

      <!-- In-game action buttons -->
      <div v-if="mode === 'in-game'" class="flex gap-2" style="width: 240px;">
        <button @click="emit('resign')" class="flex-1 text-xs px-3 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
          Resign
        </button>
        <button @click="emit('offerDraw')" class="flex-1 text-xs px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          Draw
        </button>
      </div>
    </template>

    <!-- Chat -->
    <ChatPanel
      :messages="chatMessages"
      :disabled="chatDisabled"
      @send="(t) => emit('sendChat', t)"
    />
  </div>
</template>
