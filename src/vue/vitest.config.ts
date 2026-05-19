import { defineConfig } from "vitest/config"
import vue from "@vitejs/plugin-vue"
import path from "path"

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@server": path.resolve(__dirname, "../server"),
    },
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.vitest.{ts,tsx}"],
    globals: true,
  },
})
