import { Elysia, type ElysiaContext } from "elysia"
import { staticPlugin } from "@elysiajs/static"
import { nanoid } from "nanoid"
import {
  createRoom,
  getLobbyRooms,
  getRoom,
  joinRoom,
  startGame,
} from "./rooms"
import { makeMove, isInCheck, isCheckmate, isStalemate } from "./game/engine"
import type { ServerWebSocket } from "bun"
import type { Position } from "./game/engine"

const clientIds = new WeakMap<object, string>()
const clientConnections = new Map<string, object>()
const readyConfirmations = new Map<string, Set<string>>()

function sendToClient(clientId: string, payload: Record<string, unknown>) {
  const raw = clientConnections.get(clientId)
  if (!raw) return
  // We need to send via the ElysiaWS wrapper. We use raw's send.
  // The raw is ServerWebSocket, which has send method
  const wsRaw = raw as ServerWebSocket<unknown>
  wsRaw.send(JSON.stringify(payload))
}

function broadcastLobbyUpdate() {
  const rooms = getLobbyRooms().map((r) => ({
    roomId: r.roomId,
    playerA: r.playerA,
    playerB: r.playerB,
    status: r.status,
  }))
  const payload = JSON.stringify({ type: "lobbyUpdate", rooms })

  // Publish to lobby topic via Elysia's server
  const server = app?.server
  if (server) {
    server.publish("lobby", payload)
  }
}

// Need to keep a reference to the latest app for server.publish
let app: Elysia | null = null

export function createApp() {
  app = new Elysia()
    .get("/", () => "Chinese Chess Server")
    .use(staticPlugin({ dir: "./public" }))
    .ws("/ws", {
      open(ws) {
        const clientId = nanoid(7)
        clientIds.set(ws.raw, clientId)
        clientConnections.set(clientId, ws.raw)
        ws.subscribe("lobby")
        ws.send(JSON.stringify({ type: "connected", clientId }))
      },
      message(ws, message) {
        const data = message as Record<string, unknown>

        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }))
          return
        }

        const action = data.action as string | undefined
        const myClientId = clientIds.get(ws.raw)

        if (action === "createRoom" && myClientId) {
          const room = createRoom(myClientId)
          ws.send(JSON.stringify({ type: "roomCreated", roomId: room.roomId }))
          broadcastLobbyUpdate()
          ws.send(JSON.stringify({
            type: "lobbyUpdate",
            rooms: getLobbyRooms(),
          }))
          return
        }

        if (action === "joinLobby") {
          ws.send(JSON.stringify({
            type: "lobbyUpdate",
            rooms: getLobbyRooms(),
          }))
          return
        }

        if (action === "rejoinRoom" && myClientId) {
          const roomId = data.roomId as string
          const room = getRoom(roomId)
          if (room && room.gameState && (room.playerA === myClientId || room.playerB === myClientId)) {
            // Reconnected — send current game state
            const isPlayerA = room.playerA === myClientId
            const color = isPlayerA ? room.colors!.a : room.colors!.b
            sendToClient(myClientId, {
              type: "gameStart",
              yourColor: color,
              roomId,
              opponentId: isPlayerA ? room.playerB : room.playerA,
            })
            sendToClient(myClientId, {
              type: "boardUpdate",
              board: room.gameState.board,
              turn: room.gameState.turn,
              moveCount: room.gameState.moveCount,
              inCheck: false,
            })
            // Notify opponent of reconnection
            const opponentId = isPlayerA ? room.playerB! : room.playerA
            sendToClient(opponentId, { type: "opponentReconnected" })
          }
          return
        }

        if (action === "joinRoom" && myClientId) {
          const roomId = data.roomId as string
          try {
            const room = joinRoom(roomId, myClientId)
            // Notify both players
            sendToClient(room.playerA, { type: "roomJoined", roomId, player: "A" })
            sendToClient(room.playerB!, { type: "roomJoined", roomId, player: "B" })
            broadcastLobbyUpdate()
          } catch (e) {
            ws.send(JSON.stringify({
              type: "error",
              message: (e as Error).message,
            }))
          }
          return
        }

        if (action === "startGame" && myClientId) {
          const roomId = data.roomId as string
          const room = getRoom(roomId)
          if (!room) {
            ws.send(JSON.stringify({ type: "error", message: "Room not found" }))
            return
          }

          if (!readyConfirmations.has(roomId)) {
            readyConfirmations.set(roomId, new Set())
          }
          readyConfirmations.get(roomId)!.add(myClientId)

          const bothReady =
            room.playerB !== null &&
            readyConfirmations.get(roomId)!.has(room.playerA) &&
            readyConfirmations.get(roomId)!.has(room.playerB)

          if (bothReady) {
            const result = startGame(roomId)
            const colorA = result.colors.a
            const colorB = result.colors.b

            sendToClient(room.playerA, {
              type: "gameStart",
              yourColor: colorA,
              roomId,
              opponentId: room.playerB,
            })
            sendToClient(room.playerB!, {
              type: "gameStart",
              yourColor: colorB,
              roomId,
              opponentId: room.playerA,
            })

            broadcastLobbyUpdate()
          }
          return
        }

        if (action === "move" && myClientId) {
          const roomId = data.roomId as string
          const from = data.from as Position
          const to = data.to as Position
          const room = getRoom(roomId)

          if (!room || room.status !== "playing" || !room.gameState) {
            ws.send(JSON.stringify({ type: "error", code: "INVALID_MOVE", message: "Game not active" }))
            return
          }

          // Check client is a player in this room
          if (room.playerA !== myClientId && room.playerB !== myClientId) {
            ws.send(JSON.stringify({ type: "error", code: "INVALID_MOVE", message: "Not your game" }))
            return
          }

          // Determine client's color
          const isPlayerA = room.playerA === myClientId
          const myColor = isPlayerA ? room.colors!.a : room.colors!.b

          // Check turn
          if (room.gameState.turn !== myColor) {
            ws.send(JSON.stringify({ type: "error", code: "NOT_YOUR_TURN", message: "Not your turn" }))
            return
          }

          // Validate and apply move
          const result = makeMove(room.gameState, from, to)
          if (!result) {
            ws.send(JSON.stringify({ type: "error", code: "INVALID_MOVE", message: "Illegal move" }))
            return
          }

          room.gameState = result

          // Broadcast updated board to both players
          const inCheck = isInCheck(result.board, result.turn)
          const update = {
            type: "boardUpdate",
            board: result.board,
            turn: result.turn,
            moveCount: result.moveCount,
            lastMove: { from, to },
            inCheck,
          }
          sendToClient(room.playerA, update)
          sendToClient(room.playerB!, update)

          // Check for checkmate or stalemate
          const winner =
            isCheckmate(result.board, result.turn)
              ? { result: "checkmate", winnerColor: result.turn === "red" ? "black" : "red" }
              : isStalemate(result.board, result.turn)
                ? { result: "stalemate", winnerColor: result.turn === "red" ? "black" : "red" }
                : null

          if (winner) {
            room.status = "finished"
            const endMsg = {
              type: "gameEnd",
              result: winner.result,
              winnerColor: winner.winnerColor,
              reason: `Checkmate! ${winner.winnerColor === "red" ? "Red" : "Black"} wins`,
            }
            sendToClient(room.playerA, endMsg)
            sendToClient(room.playerB!, endMsg)
            broadcastLobbyUpdate()
          }
          return
        }

        if (action === "resign" && myClientId) {
          const roomId = data.roomId as string
          const room = getRoom(roomId)
          if (!room || room.status !== "playing") {
            ws.send(JSON.stringify({ type: "error", message: "Game not active" }))
            return
          }
          room.status = "finished"
          const winnerColor = room.playerA === myClientId
            ? room.colors!.b : room.colors!.a
          const endMsg = {
            type: "gameEnd",
            result: "resign",
            winnerColor,
            reason: `${winnerColor === "red" ? "Red" : "Black"} wins by resignation`,
          }
          sendToClient(room.playerA, endMsg)
          sendToClient(room.playerB!, endMsg)
          broadcastLobbyUpdate()
          return
        }

        if (data.type === "drawOffer" && myClientId) {
          const roomId = data.roomId as string
          const room = getRoom(roomId)
          if (!room || room.status !== "playing") return
          const opponentId = room.playerA === myClientId ? room.playerB! : room.playerA
          sendToClient(opponentId, { type: "drawOffered", fromClientId: myClientId })
          return
        }

        if (data.type === "drawAccept" && myClientId) {
          const roomId = data.roomId as string
          const room = getRoom(roomId)
          if (!room || room.status !== "playing") return
          room.status = "finished"
          const endMsg = { type: "gameEnd", result: "draw", winnerColor: null, reason: "Game ended — Draw" }
          sendToClient(room.playerA, endMsg)
          sendToClient(room.playerB!, endMsg)
          broadcastLobbyUpdate()
          return
        }

        if (data.type === "drawDecline" && myClientId) {
          const roomId = data.roomId as string
          const room = getRoom(roomId)
          if (!room) return
          const opponentId = room.playerA === myClientId ? room.playerB! : room.playerA
          sendToClient(opponentId, { type: "drawDeclined" })
          return
        }

        if (data.type === "chat" && myClientId) {
          const roomId = data.roomId as string
          const room = getRoom(roomId)
          if (!room) return
          const text = data.text as string
          const isPlayerA = room.playerA === myClientId
          const color = isPlayerA ? room.colors!.a : room.colors!.b
          const chatMsg = {
            type: "chat",
            message: {
              sender: myClientId,
              text,
              timestamp: Date.now(),
              color,
            },
          }
          sendToClient(room.playerA, chatMsg)
          sendToClient(room.playerB!, chatMsg)
          return
        }
      },
      close(ws) {
        const clientId = clientIds.get(ws.raw) ?? "unknown"
        clientConnections.delete(clientId)
        console.log(JSON.stringify({
          event: "disconnect",
          clientId,
          timestamp: new Date().toISOString(),
        }))
        // Broadcast lobby update in case this player was in a waiting room
        broadcastLobbyUpdate()
      },
    })

  return app
}

export type App = ReturnType<typeof createApp>

export function startApp(port: number = Number(process.env.PORT) || 3000) {
  const app = createApp()
  app.listen(port)
  console.log(`Chinese Chess Server running on port ${port}`)
  return app
}

// Only auto-start when this file is the entry point
if (Bun.main === import.meta.path) {
  startApp()
}
