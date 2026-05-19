import { createApp } from "vue"
import { useWindowSize } from "@vueuse/core"
import App from "./App.vue"

// VueUse import verifies compilation
const { width } = useWindowSize()
console.log(`Vue app starting, viewport: ${width}px`)

const app = createApp(App)
app.mount("#app")
