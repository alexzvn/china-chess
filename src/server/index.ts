import { Elysia, type ElysiaContext } from "elysia"
import { staticPlugin } from "@elysiajs/static"

export function createApp() {
  return new Elysia()
    .get("/", () => "Chinese Chess Server")
    .use(staticPlugin({ dir: "./public" }))
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
