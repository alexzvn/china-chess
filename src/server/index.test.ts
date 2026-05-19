import { describe, it, expect } from "bun:test"
import { createApp } from "./index"

describe("Server", () => {
  it("responds to GET / with 'Chinese Chess Server'", async () => {
    const app = createApp()
    const res = await app.handle(new Request("http://localhost/"))
    expect(res.status).toBe(200)
    expect(await res.text()).toBe("Chinese Chess Server")
  })
})
