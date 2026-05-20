import { Elysia } from "elysia"
import { staticPlugin } from "@elysiajs/static"
import { readFileSync, existsSync } from "fs"
import { nanoid } from "nanoid"
import { getRoom, getLobbyRooms } from "./rooms"
import type { Room } from "./rooms"
import type { ServerWebSocket } from "bun"
import type { Position } from "./game/engine"
import { allActions } from "./actions/index.js"
import type { ActionResult } from "./actions/types.js"
import type { ServerMessage } from "./protocol.js"

const clientIds = new WeakMap<object, string>()
const clientConnections = new Map<string, object>()

function sendToClient(clientId: string, payload: Record<string, unknown>) {
  const raw = clientConnections.get(clientId)
  if (!raw) return
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any = null

function serveIndex(): Response {
  if (existsSync("./public/index.html")) {
    const html = readFileSync("./public/index.html", "utf-8")
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    })
  }
  return new Response("Chinese Chess Server")
}

function handleReclaimRoom(
  ws: any,
  myClientId: string,
  data: Record<string, unknown>,
) {
  const roomId = data.roomId as string
  const originalClientId = data.originalClientId as string
  const room = getRoom(roomId)

  if (!room) {
    sendToClient(myClientId, { type: "error", message: "Room not found" })
    return
  }

  let role: "playerA" | "playerB" | null = null
  if (room.playerA === originalClientId) {
    role = "playerA"
  } else if (room.playerB === originalClientId) {
    role = "playerB"
  }

  if (!role) {
    sendToClient(myClientId, { type: "error", message: "No matching player in room" })
    return
  }

  // Update room player reference to the NEW clientId
  if (role === "playerA") {
    room.playerA = myClientId
  } else {
    room.playerB = myClientId
  }

  // Map the new clientId to the WebSocket
  clientConnections.set(myClientId, ws.raw)
  clientConnections.delete(originalClientId)
  clientIds.set(ws.raw, myClientId)

  sendToClient(myClientId, { type: "roomReclaimed", role, roomId })
  broadcastRoomUpdate(roomId)

  // If game already started, send current board state
  if (room.gameState) {
    const color = role === "playerA" ? room.colors!.a : room.colors!.b
    const opponentId = role === "playerA" ? room.playerB! : room.playerA

    sendToClient(myClientId, {
      type: "gameStart",
      yourColor: color,
      roomId,
      opponentId,
    })
    sendToClient(myClientId, {
      type: "boardUpdate",
      board: room.gameState.board,
      turn: room.gameState.turn,
      moveCount: room.gameState.moveCount,
      inCheck: false,
    })

    sendToClient(opponentId, { type: "opponentReconnected" })
  }
}

function handleChat(myClientId: string, data: Record<string, unknown>) {
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
}

function broadcastRoomUpdate(roomId: string) {
  const room = getRoom(roomId)
  if (!room) return

  const players = [
    {
      clientId: room.playerA,
      ready: room.playerAReady,
    },
  ]
  if (room.playerB) {
    players.push({
      clientId: room.playerB,
      ready: room.playerBReady,
    })
  }

  const payload = {
    type: "roomUpdate",
    players,
    roomStatus: room.status,
  }

  sendToClient(room.playerA, payload)
  if (room.playerB) {
    sendToClient(room.playerB, payload)
  }
}

export function createApp() {
  app = new Elysia()
    .get("/", () => serveIndex())
    .get("/*", ({ request }) => {
      const url = new URL(request.url)
      const filePath = "./public" + url.pathname
      // Try to serve static file from public/
      if (existsSync(filePath)) {
        const file = readFileSync(filePath)
        const ext = url.pathname.split(".").pop() || ""
        const mime: Record<string, string> = {
          js: "application/javascript",
          css: "text/css",
          html: "text/html",
          png: "image/png",
          svg: "image/svg+xml",
          ico: "image/x-icon",
        }
        return new Response(file, {
          headers: { "Content-Type": mime[ext] || "application/octet-stream" },
        })
      }
      // SPA fallback — serve index.html for any non-file path
      if (!url.pathname.includes(".")) {
        return serveIndex()
      }
      return new Response("Not found", { status: 404 })
    })
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

        // Protocol-level messages
        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }))
          return
        }

        const action = data.action as string | undefined
        const myClientId = clientIds.get(ws.raw)
        if (!myClientId) return

        // Connection-layer actions stay inline (mutate clientConnections)
        if (action === "reclaimRoom") {
          handleReclaimRoom(ws, myClientId, data)
          return
        }

        // Chat uses data.type routing (legacy convention)
        if (data.type === "chat") {
          handleChat(myClientId, data)
          return
        }

        // Dispatch to action adapters
        let result: ActionResult

        // No-room actions
        if (action === "createRoom") {
          result = allActions.createRoom({
            clientId: myClientId,
            send: sendToClient,
            broadcastLobby: broadcastLobbyUpdate,
          })
        } else if (action === "joinLobby") {
          result = allActions.joinLobby({
            clientId: myClientId,
            send: sendToClient,
            broadcastLobby: broadcastLobbyUpdate,
          })
        }
        // Room actions
        else if (action && data.roomId) {
          const roomId = data.roomId as string
          const room = getRoom(roomId)
          if (!room) {
            result = { kind: "error", message: "Room not found" }
          } else {
            const handler = allActions[action as keyof typeof allActions]
            if (!handler) {
              result = { kind: "error", message: "Unknown action" }
            } else {
              result = handler({
                roomId,
                clientId: myClientId,
                room,
                from: data.from as Position | undefined,
                to: data.to as Position | undefined,
                send: sendToClient,
                broadcastLobby: broadcastLobbyUpdate,
              })
            }
          }
        } else {
          result = { kind: "error", message: "Unknown action" }
        }

        // Process result
        if (result.kind === "error") {
          sendToClient(myClientId, { type: "error", message: result.message })
        } else {
          result.notifications.forEach((n) => {
            if (n.kind === "send") sendToClient(n.clientId, n.message)
            else if (n.kind === "broadcastLobby") broadcastLobbyUpdate()
          })
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
