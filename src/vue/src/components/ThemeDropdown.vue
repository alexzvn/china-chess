<script setup lang="ts">
import { useTheme } from "../composables/useTheme"

const { theme, setTheme } = useTheme()

const options = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const
</script>

<template>
  <select
    v-model="theme"
    @change="setTheme(theme)"
    class="text-xs px-2 py-1 rounded border border-gray-300 bg-white text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
    aria-label="Theme"
  >
    <option v-for="opt in options" :key="opt.value" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
</template>
