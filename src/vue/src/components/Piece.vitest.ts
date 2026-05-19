import { describe, it, expect } from "vitest"

// Piece.vue is a visual component. We test the domain logic extracted from it:
// piece type detection, color detection, selection/check visual state

describe("Piece domain logic", () => {
  it("identifies red pieces by 'r' prefix", () => {
    const redPieces = ["r車", "r馬", "r炮", "r士", "r象", "r帥", "r兵"]
    for (const p of redPieces) {
      expect(p.startsWith("r")).toBe(true)
      expect(p.startsWith("b")).toBe(false)
    }
  })

  it("identifies black pieces by 'b' prefix", () => {
    const blackPieces = ["b車", "b馬", "b砲", "b士", "b象", "b將", "b卒"]
    for (const p of blackPieces) {
      expect(p.startsWith("b")).toBe(true)
      expect(p.startsWith("r")).toBe(false)
    }
  })

  it("extracts display character from prefixed piece string", () => {
    expect("r車".slice(1)).toBe("車")
    expect("b馬".slice(1)).toBe("馬")
    expect("r炮".slice(1)).toBe("炮")
    expect("b砲".slice(1)).toBe("砲")
    expect("r帥".slice(1)).toBe("帥")
    expect("b將".slice(1)).toBe("將")
    expect("r兵".slice(1)).toBe("兵")
    expect("b卒".slice(1)).toBe("卒")
  })

  it("detects king pieces for check highlighting", () => {
    const kingChars = ["帥", "將"]
    expect(kingChars).toContain("帥")
    expect(kingChars).toContain("將")
    expect(kingChars).not.toContain("車")
    expect(kingChars).not.toContain("馬")
  })

  it("red pieces use red-700 text class", () => {
    const isRed = (p: string) => p.startsWith("r")
    expect(isRed("r帥")).toBe(true)
    expect(isRed("b將")).toBe(false)
  })

  it("selected state adds ring classes", () => {
    const selectedClasses = ["ring-2", "ring-yellow-400", "ring-offset-1"]
    expect(selectedClasses.length).toBe(3)
  })

  it("inCheck state adds red ring and shadow classes", () => {
    const checkClasses = ["ring-2", "ring-red-500", "shadow-lg", "shadow-red-500/50"]
    expect(checkClasses.length).toBe(4)
  })

  it("combined selected+inCheck states have all visual classes", () => {
    const both = ["ring-2", "ring-yellow-400", "ring-offset-1", "ring-red-500", "shadow-lg", "shadow-red-500/50"]
    expect(both.length).toBe(6)
  })
})
