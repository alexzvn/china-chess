<script setup lang="ts">
import { useWindowSize } from "@vueuse/core"

const { width } = useWindowSize()
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <h1 class="text-4xl font-bold text-gray-800">Chinese Chess — Hello World</h1>
    <p class="text-gray-500 mt-2">Viewport: {{ width }}px</p>
  </div>
</template>
