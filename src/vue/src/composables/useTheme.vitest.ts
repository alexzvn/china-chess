import { describe, it, expect, beforeEach } from "vitest"
import { useTheme } from "./useTheme"

describe("useTheme — dark mode", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("dark")
  })

  it('setTheme("dark") adds the dark class to documentElement', () => {
    const { theme, setTheme } = useTheme()
    setTheme("dark")
    expect(theme.value).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it('setTheme("light") removes the dark class from documentElement', () => {
    const { theme, setTheme } = useTheme()
    setTheme("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    setTheme("light")
    expect(theme.value).toBe("light")
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it('setTheme("system") applies dark class when OS prefers dark', () => {
    const { theme, setTheme } = useTheme()
    // happy-dom defaults to light, so we need to mock matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    })
    setTheme("system")
    expect(theme.value).toBe("system")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it('setTheme("system") does not apply dark class when OS prefers light', () => {
    const { theme, setTheme } = useTheme()
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    })
    setTheme("system")
    expect(theme.value).toBe("system")
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("setTheme writes to localStorage", () => {
    const { setTheme } = useTheme()
    setTheme("dark")
    expect(localStorage.getItem("theme")).toBe("dark")
    setTheme("light")
    expect(localStorage.getItem("theme")).toBe("light")
    setTheme("system")
    expect(localStorage.getItem("theme")).toBe("system")
  })

  it("reads stored theme from localStorage on init", () => {
    localStorage.setItem("theme", "dark")
    const { theme } = useTheme()
    expect(theme.value).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("responds to system preference changes when in system mode", () => {
    let listener: (() => void) | null = null
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        addEventListener: (event: string, cb: () => void) => {
          if (event === "change") listener = cb
        },
        removeEventListener: () => {},
      }),
    })
    const { theme, setTheme } = useTheme()
    setTheme("system")
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    // Simulate OS switching to dark
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: true,
        addEventListener: (event: string, cb: () => void) => {
          if (event === "change") listener = cb
        },
        removeEventListener: () => {},
      }),
    })
    listener!()
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  describe("toggleTheme", () => {
    it("cycles light → dark → system → light", () => {
      localStorage.setItem("theme", "light")
      const { theme, toggleTheme } = useTheme()
      expect(theme.value).toBe("light")
      toggleTheme()
      expect(theme.value).toBe("dark")
      toggleTheme()
      expect(theme.value).toBe("system")
      toggleTheme()
      expect(theme.value).toBe("light")
    })
  })
})
