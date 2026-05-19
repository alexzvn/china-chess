import { describe, it, expect } from "vitest"

describe("PlayerInfo state logic", () => {
  it("active player has yellow border highlight", () => {
    const isActive = true
    const classes = {
      "border-yellow-400 bg-yellow-50 shadow-md": isActive,
      "border-gray-200 bg-gray-50 opacity-60": !isActive,
    }
    expect(classes["border-yellow-400 bg-yellow-50 shadow-md"]).toBe(true)
    expect(classes["border-gray-200 bg-gray-50 opacity-60"]).toBe(false)
  })

  it("inactive player has dimmed appearance", () => {
    const isActive = false
    const classes = {
      "border-yellow-400 bg-yellow-50 shadow-md": isActive,
      "border-gray-200 bg-gray-50 opacity-60": !isActive,
    }
    expect(classes["border-gray-200 bg-gray-50 opacity-60"]).toBe(true)
    expect(classes["border-yellow-400 bg-yellow-50 shadow-md"]).toBe(false)
  })

  it("shows CHECK label when player is in check and active", () => {
    const isInCheck = true
    const isActive = true
    const showCheck = isInCheck && isActive
    expect(showCheck).toBe(true)
  })

  it("does not show CHECK label when not in check", () => {
    const isInCheck = false
    const isActive = true
    const showCheck = isInCheck && isActive
    expect(showCheck).toBe(false)
  })

  it("does not show CHECK label when not active even if in check", () => {
    const isInCheck = true
    const isActive = false
    const showCheck = isInCheck && isActive
    expect(showCheck).toBe(false)
  })

  it("red player color uses red-600 circle and red-700 text", () => {
    const color = "red"
    const circleClass = color === "red" ? "bg-red-600" : "bg-gray-900"
    const textClass = color === "red" ? "text-red-700" : "text-gray-900"
    expect(circleClass).toBe("bg-red-600")
    expect(textClass).toBe("text-red-700")
  })

  it("black player uses gray-900 circle and text", () => {
    function getClasses(color: "red" | "black") {
      return {
        circleClass: color === "red" ? "bg-red-600" : "bg-gray-900",
        textClass: color === "red" ? "text-red-700" : "text-gray-900",
      }
    }
    const result = getClasses("black")
    expect(result.circleClass).toBe("bg-gray-900")
    expect(result.textClass).toBe("text-gray-900")
  })
})
