import { createRouter, createWebHistory } from "vue-router"
import Lobby from "./views/Lobby.vue"
import Game from "./views/Game.vue"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "lobby",
      component: Lobby,
    },
    {
      path: "/room/:id",
      name: "game",
      component: Game,
    },
  ],
})

export default router
