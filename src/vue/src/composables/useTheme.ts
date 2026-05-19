import { shallowRef, onUnmounted } from "vue"

const THEME_STORAGE_KEY = "theme" as const
const SYSTEM_PREFERENCE_QUERY = "(prefers-color-scheme: dark)" as const

export type ThemeMode = "light" | "dark" | "system"

function getSystemPreference(): "dark" | "light" {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia(SYSTEM_PREFERENCE_QUERY).matches ? "dark" : "light"
  }
  return "light"
}

function applyDarkClass(isDark: boolean): void {
  if (typeof document !== "undefined") {
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }
}

export function useTheme() {
  const stored = (typeof localStorage !== "undefined" && localStorage.getItem(THEME_STORAGE_KEY)) as ThemeMode | null
  const theme = shallowRef<ThemeMode>(stored ?? "system")

  let mediaQuery: MediaQueryList | null = null
  let systemListener: (() => void) | null = null

  function resolveIsDark(currentTheme: ThemeMode): boolean {
    if (currentTheme === "system") {
      return getSystemPreference() === "dark"
    }
    return currentTheme === "dark"
  }

  function syncClass() {
    applyDarkClass(resolveIsDark(theme.value))
  }

  syncClass()

  if (theme.value === "system" && typeof window !== "undefined" && window.matchMedia) {
    mediaQuery = window.matchMedia(SYSTEM_PREFERENCE_QUERY)
    systemListener = () => {
      if (theme.value === "system") {
        syncClass()
      }
    }
    mediaQuery.addEventListener("change", systemListener)
  }

  function setMode(mode: ThemeMode) {
    theme.value = mode
    syncClass()
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, mode)
    }
    // Re-setup listener if switching to/from system
    if (mode === "system") {
      if (typeof window !== "undefined" && window.matchMedia && !mediaQuery) {
        mediaQuery = window.matchMedia(SYSTEM_PREFERENCE_QUERY)
        systemListener = () => {
          if (theme.value === "system") {
            syncClass()
          }
        }
        mediaQuery.addEventListener("change", systemListener)
      }
    } else if (mediaQuery && systemListener) {
      mediaQuery.removeEventListener("change", systemListener)
      mediaQuery = null
      systemListener = null
    }
  }

  function toggleMode() {
    const modes: ThemeMode[] = ["light", "dark", "system"]
    const currentIndex = modes.indexOf(theme.value)
    const nextIndex = (currentIndex + 1) % modes.length
    setMode(modes[nextIndex]!)
  }

  onUnmounted(() => {
    if (mediaQuery && systemListener) {
      mediaQuery.removeEventListener("change", systemListener)
    }
  })

  return {
    theme,
    setTheme: setMode,
    toggleTheme: toggleMode,
  }
}
