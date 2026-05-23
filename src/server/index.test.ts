import { describe, it, expect } from "bun:test"
import { createApp } from "./index"

describe("Server", () => {
  it("responds to GET / with HTML", async () => {
    const app = createApp()
    const res = await app.handle(new Request("http://localhost/"))
    expect(res.status).toBe(200)
    const text = await res.text()
    // Serve index.html if built, or fallback text otherwise
    expect(text.length).toBeGreaterThan(0)
  })
})
