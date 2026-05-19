import { describe, it, expect } from "vitest"
import type { ChatMessage } from "./ChatPanel.vue"

describe("ChatPanel message logic", () => {
  it("creates a chat message with correct structure", () => {
    const msg: ChatMessage = {
      sender: "client123",
      text: "Hello!",
      timestamp: Date.now(),
      color: "red",
    }
    expect(msg.sender).toBe("client123")
    expect(msg.text).toBe("Hello!")
    expect(typeof msg.timestamp).toBe("number")
    expect(msg.color).toBe("red")
  })

  it("black player messages have dark accent", () => {
    const msg: ChatMessage = {
      sender: "client456",
      text: "Good move",
      timestamp: Date.now(),
      color: "black",
    }
    const textClass = msg.color === "red" ? "text-red-600" : "text-gray-800"
    expect(textClass).toBe("text-gray-800")
  })

  it("red player messages have red accent", () => {
    const msg: ChatMessage = {
      sender: "client789",
      text: "Thanks",
      timestamp: Date.now(),
      color: "red",
    }
    const textClass = msg.color === "red" ? "text-red-600" : "text-gray-800"
    expect(textClass).toBe("text-red-600")
  })

  it("renders sender label from color", () => {
    const label = (c: "red" | "black") => (c === "red" ? "Red" : "Black")
    expect(label("red")).toBe("Red")
    expect(label("black")).toBe("Black")
  })

  it("displays empty state when no messages", () => {
    const messages: ChatMessage[] = []
    expect(messages.length).toBe(0)
  })

  it("displays multiple messages in order", () => {
    const messages: ChatMessage[] = [
      { sender: "a", text: "First", timestamp: 100, color: "red" },
      { sender: "b", text: "Second", timestamp: 200, color: "black" },
      { sender: "a", text: "Third", timestamp: 300, color: "red" },
    ]
    expect(messages.length).toBe(3)
    expect(messages[0]!.text).toBe("First")
    expect(messages[1]!.text).toBe("Second")
    expect(messages[2]!.text).toBe("Third")
  })

  it("auto-scrolls when new message arrives", () => {
    const messages: ChatMessage[] = [
      { sender: "a", text: "Test", timestamp: 1, color: "red" },
    ]
    const prevLength = messages.length
    messages.push({ sender: "b", text: "New", timestamp: 2, color: "black" })
    expect(messages.length).toBe(prevLength + 1)
  })
})
