<script setup lang="ts">
import ChatPanel from "./ChatPanel.vue"
import type { ChatMessage } from "./ChatPanel.vue"

export interface RoomPlayer {
  clientId: string
  ready: boolean
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
}>()

const emit = defineEmits<{
  toggleReady: []
  sendChat: [text: string]
  resign: []
  offerDraw: []
  acceptDraw: []
  declineDraw: []
  backToLobby: []
}>()

function playerLabel(clientId: string): string {
  if (clientId === props.myClientId) return "You"
  return `Player ${clientId.slice(0, 5)}`
}
</script>

<template>
  <div class="flex flex-col gap-3 w-full md:w-64">
    <!-- Pre-game: player list + ready button -->
    <template v-if="mode === 'pre-game'">
      <div class="border border-gray-300 rounded-lg bg-white overflow-hidden">
        <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 border-b border-gray-200 bg-gray-50">
          Players
        </div>
        <div class="p-3 space-y-2">
          <div
            v-for="p in players"
            :key="p.clientId"
            class="flex items-center justify-between py-1"
          >
            <span class="text-sm font-medium text-gray-800">
              {{ playerLabel(p.clientId) }}
            </span>
            <span
              class="text-xs px-2 py-0.5 rounded-full font-semibold"
              :class="p.ready ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
            >
              {{ p.ready ? "Ready ✓" : "Not Ready" }}
            </span>
          </div>
          <!-- Placeholder if waiting for opponent -->
          <div v-if="players.length < 2" class="flex items-center justify-between py-1">
            <span class="text-sm text-gray-400 italic">Waiting for opponent...</span>
          </div>
        </div>
        <div class="px-3 pb-3">
          <button
            v-if="players.some((p) => p.clientId === myClientId)"
            @click="emit('toggleReady')"
            class="w-full px-4 py-2 text-sm font-medium rounded-lg transition-all"
            :class="
              players.find((p) => p.clientId === myClientId)?.ready
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300 hover:bg-yellow-200'
                : 'bg-green-600 text-white hover:bg-green-700'
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
      <div class="border border-gray-300 rounded-lg bg-white overflow-hidden">
        <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 border-b border-gray-200 bg-gray-50">
          Game Info
        </div>
        <div class="p-3 space-y-2">
          <!-- My info -->
          <div
            class="px-3 py-2 rounded-lg border-2 transition-all"
            :class="{
              'border-yellow-400 bg-yellow-50 shadow-sm': turn === myColor,
              'border-gray-200 bg-gray-50 opacity-60': turn !== myColor,
              'border-red-400 bg-red-50': inCheckColor === myColor,
            }"
          >
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full shrink-0" :class="myColor === 'red' ? 'bg-red-600' : 'bg-gray-900'" />
              <span class="text-sm font-medium text-gray-800">You ({{ myColor === 'red' ? 'Red' : 'Black' }})</span>
              <span v-if="inCheckColor === myColor" class="ml-auto text-xs font-bold text-red-600 animate-pulse">CHECK!</span>
            </div>
          </div>
          <!-- Opponent info -->
          <div
            class="px-3 py-2 rounded-lg border-2 transition-all"
            :class="{
              'border-yellow-400 bg-yellow-50 shadow-sm': turn !== myColor,
              'border-gray-200 bg-gray-50 opacity-60': turn === myColor,
              'border-red-400 bg-red-50': inCheckColor !== myColor && inCheckColor !== null,
            }"
          >
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full shrink-0" :class="myColor === 'red' ? 'bg-gray-900' : 'bg-red-600'" />
              <span class="text-sm font-medium text-gray-800">Opponent ({{ myColor === 'red' ? 'Black' : 'Red' }})</span>
              <span v-if="inCheckColor !== null && inCheckColor !== myColor" class="ml-auto text-xs font-bold text-red-600 animate-pulse">CHECK!</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Game over banner -->
      <div v-if="mode === 'game-over'" class="bg-gray-800 text-white px-4 py-3 rounded-lg text-center">
        <p class="text-sm font-bold">{{ gameResult }}</p>
        <button @click="emit('backToLobby')" class="mt-2 text-xs text-blue-300 hover:text-blue-200 underline">
          Back to Lobby
        </button>
      </div>

      <!-- In-game action buttons -->
      <div v-if="mode === 'in-game'" class="flex gap-2">
        <button @click="emit('resign')" class="flex-1 text-xs px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
          Resign
        </button>
        <button @click="emit('offerDraw')" class="flex-1 text-xs px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
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
