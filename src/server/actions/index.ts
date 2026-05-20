import { roomActions } from "./room"
import { gameActions } from "./game"
import { phaseActions } from "./phase"

export { roomActions, gameActions, phaseActions }

export const allActions = {
  ...roomActions,
  ...gameActions,
  ...phaseActions,
}

export type { RoomActionContext, NoRoomActionContext, ActionResult, Notification } from "./types"
