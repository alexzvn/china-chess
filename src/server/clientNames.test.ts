import { describe, it, expect, beforeEach } from "bun:test"
import { handleSetName, getClientName, getAllClientNames } from "./clientNames"

describe("Client Names", () => {
  beforeEach(() => {
    // Reset client names before each test
    const { clientNames } = require("./clientNames")
    clientNames.clear()
  })

  it("stores a name for a clientId", () => {
    const result = handleSetName({ clientId: "client-abc", name: "PlayerOne" })
    
    expect(result.kind).toBe("ok")
    expect(getClientName("client-abc")).toBe("PlayerOne")
  })

  it("rejects name longer than 16 characters", () => {
    const longName = "a".repeat(17)
    const result = handleSetName({ clientId: "client-abc", name: longName })
    
    expect(result.kind).toBe("error")
    if (result.kind === "error") {
      expect(result.message).toBe("Name must be 16 characters or less")
    }
  })

  it("allows Unicode characters in name", () => {
    const result = handleSetName({ clientId: "client-abc", name: "象棋高手" })
    
    expect(result.kind).toBe("ok")
    expect(getClientName("client-abc")).toBe("象棋高手")
  })

  it("returns empty string for unknown client", () => {
    expect(getClientName("unknown-client")).toBe("")
  })

  it("updates existing name", () => {
    handleSetName({ clientId: "client-abc", name: "FirstName" })
    handleSetName({ clientId: "client-abc", name: "SecondName" })
    
    expect(getClientName("client-abc")).toBe("SecondName")
  })

  it("returns all client names", () => {
    handleSetName({ clientId: "client-1", name: "Alice" })
    handleSetName({ clientId: "client-2", name: "Bob" })
    
    const allNames = getAllClientNames()
    expect(allNames.get("client-1")).toBe("Alice")
    expect(allNames.get("client-2")).toBe("Bob")
  })
})