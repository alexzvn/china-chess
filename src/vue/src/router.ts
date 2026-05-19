import { createRouter, createWebHistory } from "vue-router"
import Lobby from "./views/Lobby.vue"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "lobby",
      component: Lobby,
    },
  ],
})

export default router
