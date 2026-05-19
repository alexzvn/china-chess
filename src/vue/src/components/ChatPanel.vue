<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue"

export interface ChatMessage {
  sender: string
  text: string
  timestamp: number
  color: "red" | "black"
}

const props = defineProps<{
  messages: ChatMessage[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
}>()

const input = ref("")
const listRef = ref<HTMLElement | null>(null)

function send() {
  const text = input.value.trim()
  if (!text) return
  emit("send", text)
  input.value = ""
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

// Auto-scroll when new messages arrive
watch(
  () => props.messages.length,
  async () => {
    await nextTick()
    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight
    }
  },
)
</script>

<template>
  <div class="flex flex-col border border-gray-300 rounded-lg bg-white overflow-hidden" style="width: 240px; height: 100%; min-height: 300px">
    <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 border-b border-gray-200 bg-gray-50">
      Chat
    </div>
    <div ref="listRef" class="flex-1 overflow-y-auto p-2 space-y-1">
      <div v-for="(msg, i) in messages" :key="i" class="text-sm">
        <span class="font-medium" :class="msg.color === 'red' ? 'text-red-600' : 'text-gray-800'">
          {{ msg.color === "red" ? "Red" : "Black" }}:
        </span>
        <span class="text-gray-700 ml-1">{{ msg.text }}</span>
      </div>
      <div v-if="messages.length === 0" class="text-xs text-gray-400 text-center py-4">
        No messages yet
      </div>
    </div>
    <div class="border-t border-gray-200 p-2 flex gap-1">
      <input
        v-model="input"
        type="text"
        placeholder="Type a message..."
        :disabled="disabled"
        class="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400 disabled:opacity-50"
        @keydown="onKeydown"
      />
      <button
        @click="send"
        :disabled="disabled || !input.trim()"
        class="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        Send
      </button>
    </div>
  </div>
</template>
