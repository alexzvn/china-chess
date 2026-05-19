import { describe, it, expect } from "vitest"

describe("Piece", () => {
  it("determines red piece from prefix", () => {
    const piece = "r車"
    expect(piece.startsWith("r")).toBe(true)
    expect(piece.startsWith("b")).toBe(false)
    expect(piece.slice(1)).toBe("車")
  })

  it("determines black piece from prefix", () => {
    const piece = "b馬"
    expect(piece.startsWith("b")).toBe(true)
    expect(piece.slice(1)).toBe("馬")
  })

  it("detects check king characters", () => {
    expect(["帥", "將"]).toContain("帥")
    expect(["帥", "將"]).toContain("將")
    expect(["帥", "將"]).not.toContain("車")
  })
})
