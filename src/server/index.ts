import { Elysia, type ElysiaContext } from "elysia"
import { staticPlugin } from "@elysiajs/static"
import { nanoid } from "nanoid"

const clientIds = new WeakMap<object, string>()

export function createApp() {
  return new Elysia()
    .get("/", () => "Chinese Chess Server")
    .use(staticPlugin({ dir: "./public" }))
    .ws("/ws", {
      open(ws) {
        const clientId = nanoid(7)
        clientIds.set(ws.raw, clientId)
        ws.send(JSON.stringify({ type: "connected", clientId }))
      },
      message(ws, message) {
        // Elysia already JSON-parses messages starting with {, [, ", /
        const data = message as Record<string, unknown>
        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }))
        }
      },
      close(ws) {
        const clientId = clientIds.get(ws.raw) ?? "unknown"
        console.log(JSON.stringify({
          event: "disconnect",
          clientId,
          timestamp: new Date().toISOString(),
        }))
      },
    })
}

export type App = ReturnType<typeof createApp>

export function startApp(port: number = Number(process.env.PORT) || 3000) {
  const app = createApp()
  app.listen(port)
  console.log(`Chinese Chess Server running on port ${port}`)
  return app
}

// Only auto-start when this file is the entry point
if (Bun.main === import.meta.path) {
  startApp()
}
