import { shallowRef, onUnmounted } from "vue"

export function useWebSocket(onMessage?: (data: Record<string, unknown>) => void) {
  const clientId = shallowRef<string | null>(null)
  const status = shallowRef<"connecting" | "connected" | "disconnected" | "error">("connecting")
  let ws: WebSocket | null = null

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  const host = import.meta.env.DEV ? "localhost:3000" : window.location.host
  const url = `${protocol}//${host}/ws`

  function connect() {
    ws = new WebSocket(url)

    ws.onopen = () => {
      status.value = "connected"
    }

    ws.onmessage = (e: MessageEvent) => {
      const data = JSON.parse(e.data) as Record<string, unknown>
      if (data.type === "connected") {
        clientId.value = data.clientId as string
      }
      onMessage?.(data)
    }

    ws.onclose = () => {
      status.value = "disconnected"
    }

    ws.onerror = () => {
      status.value = "error"
    }
  }

  function send(payload: Record<string, unknown>) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload))
    }
  }

  function disconnect() {
    ws?.close()
    ws = null
  }

  connect()

  onUnmounted(() => {
    disconnect()
  })

  return {
    clientId,
    status,
    send,
    disconnect,
  }
}
