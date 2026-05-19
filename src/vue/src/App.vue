<script setup lang="ts">
import { ref, onMounted } from "vue"

const clientId = ref<string | null>(null)
const status = ref<string>("Connecting...")
const logs = ref<string[]>([])

onMounted(() => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  const host = import.meta.env.DEV
    ? "localhost:3000"
    : window.location.host
  const url = `${protocol}//${host}/ws`

  const ws = new WebSocket(url)

  ws.onmessage = (e: MessageEvent) => {
    const data = JSON.parse(e.data)
    if (data.type === "connected") {
      clientId.value = data.clientId
      status.value = `Connected: ${data.clientId}`
      logs.value.push(`Received clientId: ${data.clientId}`)
    } else if (data.type === "pong") {
      logs.value.push("Echo received")
    }
  }

  ws.onclose = () => {
    status.value = "Disconnected"
  }

  ws.onerror = () => {
    status.value = "Connection error"
  }

  ws.onopen = () => {
    status.value = "Connected"
    ws.send(JSON.stringify({ type: "ping" }))
    logs.value.push("Sent ping")
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-800">Chinese Chess</h1>
      <p class="mt-4 text-lg" :class="{
        'text-green-600': status.startsWith('Connected'),
        'text-yellow-600': status === 'Connecting...',
        'text-red-600': status.startsWith('Disconnected') || status === 'Connection error'
      }">
        {{ status }}
      </p>
      <div class="mt-4 text-sm text-gray-500">
        <div v-for="(log, i) in logs" :key="i">{{ log }}</div>
      </div>
    </div>
  </div>
</template>
