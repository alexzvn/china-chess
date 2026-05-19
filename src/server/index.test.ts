import { describe, it, expect } from "bun:test"
import { createApp } from "./index"

describe("Server", () => {
  it("responds to GET / with 'Chinese Chess Server'", async () => {
    const app = createApp()
    const server = Bun.serve({
      port: 0,
      fetch(req, bunServer) {
        return app.handle(req, bunServer)
      },
    })
    const port = server.port
    const res = await fetch(`http://localhost:${port}/`)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe("Chinese Chess Server")
    server.stop()
  })
})
