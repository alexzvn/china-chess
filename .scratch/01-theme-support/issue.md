# 01 — Theme Support (Dark/Light/System)

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## Parent

`.scratch/room-lifecycle-and-theme/issue.md`

## What to build

A complete theme system with Light, Dark, and System modes.

### useTheme composable

Create `src/vue/src/composables/useTheme.ts` following the existing composable patterns (like `useBoard.ts`, `useSound.ts`):

- Default value is `"system"` if no stored preference exists.
- Reads `localStorage("theme")` for persisted preference (values: `"light"`, `"dark"`, `"system"`).
- Uses `matchMedia("(prefers-color-scheme: dark)")` to detect system preference when in system mode.
- Applies/removes the `dark` class on the `<html>` element.
- Listens for system preference changes via `matchMedia` listener and updates the class in real time.
- Exposes `theme` (ref), `setTheme(mode: "light" | "dark" | "system")`, and `toggleTheme()` (cycles through modes).

### Tailwind configuration

Enable `darkMode: 'class'` in `tailwind.config.ts` so the `dark:` prefix works with the manually applied `dark` class on `<html>`.

### Theme dropdown component

Create a small reusable theme dropdown component (`src/vue/src/components/ThemeDropdown.vue`) that renders a `<select>` with three options: Light, Dark, System. Binds to the `useTheme` composable and calls `setTheme` on change.

Place the dropdown in both:
- `src/vue/src/views/Game.vue` — in the room header (top of the game view)
- `src/vue/src/views/Lobby.vue` — in the lobby header

### Dark mode styling

Apply `dark:` Tailwind variants to all components. Every component needs dark mode coverage:

- **Page backgrounds:** `bg-gray-50` → `dark:bg-gray-950`
- **Card backgrounds:** `bg-white` → `dark:bg-gray-900`
- **Text colors:** `text-gray-800` → `dark:text-gray-100`, `text-gray-500` → `dark:text-gray-400`
- **Borders:** `border-gray-300` → `dark:border-gray-700`
- **Buttons:** hover states, disabled states, primary/secondary variants
- **Badges:** ready status, check indicators, turn indicators
- **Board:** board square colors need dark variants (light squares: `bg-amber-200` → `dark:bg-amber-700`, dark squares: `bg-amber-800` → `dark:bg-amber-950`)
- **Notifications:** draw offer banner, error banners

### CSS transitions

Add smooth CSS transitions for theme changes. Apply `transition-colors duration-300` to root elements or use a global rule for `background-color`, `color`, `border-color` transitions.

## Acceptance criteria

- [ ] `useTheme` composable exists at `src/vue/src/composables/useTheme.ts` with `theme`, `setTheme()`, and `toggleTheme()` exports
- [ ] Default theme is `system` when no localStorage value exists
- [ ] `setTheme("dark")` applies `dark` class on `<html>` and stores in localStorage
- [ ] `setTheme("light")` removes `dark` class and stores in localStorage
- [ ] `setTheme("system")` applies `dark` class when OS prefers dark, removes when OS prefers light
- [ ] System preference changes are reflected in real time (via `matchMedia` listener)
- [ ] Tailwind config has `darkMode: 'class'`
- [ ] Theme dropdown component renders with Light/Dark/System options
- [ ] Theme dropdown is placed in Game.vue header and Lobby.vue header
- [ ] All components have `dark:` variants: Board, Piece, SidePanel, ChatPanel, RoomCard, Lobby, Game
- [ ] Board squares have dark mode colors (both light and dark squares)
- [ ] Buttons, badges, borders, and interactive states have dark mode variants
- [ ] Smooth CSS transitions between theme modes (300ms)
- [ ] Theme preference persists across page reloads
- [ ] `useTheme.vitest.ts` tests exist covering: default value, setTheme for all modes, localStorage persistence, system preference detection, real-time system change detection

## Blocked by

None - can start immediately
