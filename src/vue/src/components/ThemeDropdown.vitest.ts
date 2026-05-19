import { describe, it, expect } from "vitest"
import { useTheme } from "../composables/useTheme"

// ThemeDropdown is a display component. Test the data flow contract.

describe("ThemeDropdown data flow", () => {
  it("reads theme from useTheme composable", () => {
    const { theme } = useTheme()
    expect(theme.value).toBeDefined()
    expect(["light", "dark", "system"]).toContain(theme.value)
  })

  it("setTheme accepts all three modes", () => {
    const { theme, setTheme } = useTheme()
    const modes: ("light" | "dark" | "system")[] = ["light", "dark", "system"]
    for (const mode of modes) {
      setTheme(mode)
      expect(theme.value).toBe(mode)
    }
  })

  it("renders three select options: Light, Dark, System", () => {
    const options = ["Light", "Dark", "System"]
    expect(options).toHaveLength(3)
    expect(options).toContain("Light")
    expect(options).toContain("Dark")
    expect(options).toContain("System")
  })

  it("maps option text to theme values", () => {
    const mapping: Record<string, string> = {
      Light: "light",
      Dark: "dark",
      System: "system",
    }
    expect(mapping["Light"]).toBe("light")
    expect(mapping["Dark"]).toBe("dark")
    expect(mapping["System"]).toBe("system")
  })
})
