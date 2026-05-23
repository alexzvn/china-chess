import { Elysia } from "elysia"
import { staticPlugin } from "@elysiajs/static"
import { readFileSync, existsSync } from "fs"
import { nanoid } from "nanoid"
import { getRoom, getLobbyRooms, getSpectators, rooms as allRooms, isBotRoom, getBotClientId } from "./rooms"
import { handleSetName, getClientName, clientNames } from "./clientNames"
import type { Room } from "./rooms"
import type { ServerWebSocket } from "bun"
import type { Position } from "./game/engine"
import { allActions } from "./actions/index.js"
import type { ActionResult } from "./actions/types.js"
import type { ServerMessage } from "./protocol.js"
import { makeMove, isCheckmate, isStalemate } from "./game/engine"
import { applyTimeControl, getTimeUpdate, isTimeOut } from "./rooms"
import { isPerpetualChase, isInsufficientMaterial, getPositionKey } from "./game/rules"

const clientIds = new WeakMap<object, string>()
const clientConnections = new Map<string, object>()

function sendToClient(clientId: string, payload: Record<string, unknown>) {
  const raw = clientConnections.get(clientId)
  if (!raw) return
  const wsRaw = raw as ServerWebSocket<unknown>
  wsRaw.send(JSON.stringify(payload))
}

function broadcastLobbyUpdate() {
  const lobbyList = [...getLobbyRooms(), ...Array.from(allRooms.values()).filter(r => r.status === "playing")]
  const roomsData = lobbyList.map((r) => ({
    roomId: r.roomId,
    playerA: r.playerA,
    playerB: r.playerB,
    status: r.status,
    hostName: getClientName(r.playerA) || r.playerA.slice(0, 5),
    spectatorCount: r.spectators?.length || 0,
  }))
  const payload = JSON.stringify({ type: "lobbyUpdate", rooms: roomsData })

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

  // Transfer player name from old clientId to new clientId
  const playerName = getClientName(originalClientId)
  if (playerName) {
    clientNames.set(myClientId, playerName)
    clientNames.delete(originalClientId)
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

    // Send current time state on reconnect
    if (room.timeA !== undefined && room.timeB !== undefined) {
      sendToClient(myClientId, {
        type: "timeUpdate",
        timeA: room.timeA,
        timeB: room.timeB,
        timeAColor: room.colors!.a,
      })
    }

    sendToClient(opponentId, { type: "opponentReconnected" })
  }
}

function handleChat(myClientId: string, data: Record<string, unknown>) {
  const roomId = data.roomId as string
  const room = getRoom(roomId)
  if (!room) return
  const text = data.text as string
  const isPlayerA = room.playerA === myClientId
  const isPlayerB = room.playerB === myClientId
  const isSpectator = room.spectators?.includes(myClientId)
  const color: "red" | "black" | "spectator" = isSpectator
    ? "spectator"
    : isPlayerA && room.colors
      ? room.colors.a
      : isPlayerB && room.colors
        ? room.colors.b
        : "spectator" // fallback for pre-game where colors aren't assigned yet
  const chatMsg = {
    type: "chat",
    message: {
      sender: myClientId,
      senderName: getClientName(myClientId),
      text,
      timestamp: Date.now(),
      color,
    },
  }
  sendToClient(room.playerA, chatMsg)
  if (room.playerB) {
    sendToClient(room.playerB, chatMsg)
  }
  // Also send to spectators
  room.spectators?.forEach(spectatorId => {
    sendToClient(spectatorId, chatMsg)
  })
}

// Bot move scheduling
const botTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
let botMoveId = 0

function scheduleBotMove(roomId: string) {
  // Clear any existing timeout
  const existing = botTimeouts.get(roomId)
  if (existing) clearTimeout(existing)

  const room = getRoom(roomId)
  if (!room || !room.gameState || room.status !== "playing") return
  if (!room.colors) return

  const botColor = room.colors.b // Bot is always playerB
  const botId = room.botClientId
  if (!botId) return

  // Only schedule if it's the bot's turn
  if (room.gameState.turn !== botColor) return

  // Random delay between 500-1500ms to feel natural
  const delay = 500 + Math.random() * 1000

  const timeout = setTimeout(() => {
    botTimeouts.delete(roomId)

    const currentRoom = getRoom(roomId)
    if (!currentRoom || !currentRoom.gameState || currentRoom.status !== "playing") return
    if (currentRoom.gameState.turn !== botColor) return

    // Find best move in a worker thread so the event loop stays responsive
    const moveId = ++botMoveId
    const worker = new Worker(new URL("./game/bot.worker.ts", import.meta.url).href)

    worker.postMessage({
      id: moveId,
      roomId,
      board: currentRoom.gameState.board,
      color: botColor,
      difficulty: currentRoom.botDifficulty ?? "medium",
    })

    worker.onmessage = (e: MessageEvent) => {
      const data = e.data
      worker.terminate()

      // Verify this response is still for the right room and turn
      const verifyRoom = getRoom(roomId)
      if (!verifyRoom || !verifyRoom.gameState || verifyRoom.status !== "playing") return
      if (verifyRoom.gameState.turn !== botColor) return

      if (!data.from || !data.to) return

      // Apply the bot move
      const result = makeMove(verifyRoom.gameState, data.from, data.to)
      if (!result) return

      verifyRoom.gameState = result

      // Track move history
      if (!verifyRoom.moveHistory) verifyRoom.moveHistory = []
      verifyRoom.moveHistory.push({ from: data.from, to: data.to, captured: result.captured ?? null })

      // Apply time control
      applyTimeControl(roomId, botColor)

      // Send board update
      const inCheck = false // We'll skip check detection for bot for now
      const boardMsg: ServerMessage = {
        type: "boardUpdate",
        board: result.board,
        turn: result.turn,
        moveCount: result.moveCount,
        lastMove: { from: data.from, to: data.to },
        inCheck,
      }

      sendToClient(verifyRoom.playerA, boardMsg)
      // Also send board update to spectators
      verifyRoom.spectators?.forEach(s => sendToClient(s, boardMsg as any))

      // Send time update
      const timeUpdate = getTimeUpdate(roomId)
      if (timeUpdate) {
        const timeMsg: ServerMessage = {
          type: "timeUpdate",
          timeA: timeUpdate.timeA,
          timeB: timeUpdate.timeB,
          timeAColor: verifyRoom.colors!.a,
        }
        sendToClient(verifyRoom.playerA, timeMsg)
        verifyRoom.spectators?.forEach(s => sendToClient(s, timeMsg as any))
      }

      // Check for game end
      const history = result.positionHistory ?? []
      const isDraw = isPerpetualChase(history) || isInsufficientMaterial(result.board)
      const winner = isDraw
        ? null
        : isCheckmate(result.board, result.turn)
          ? { result: "checkmate" as const, winnerColor: result.turn === "red" ? "black" : "red" as const }
          : isStalemate(result.board, result.turn)
            ? { result: "stalemate" as const, winnerColor: result.turn === "red" ? "black" : "red" as const }
            : null

      if (isDraw) {
        verifyRoom.status = "finished"
        verifyRoom.gameEndExpiresAt = Date.now() + 30000
        const endMsg: ServerMessage = { type: "gameEnd", result: "draw", winnerColor: null, reason: "Game ended — Draw", expiresAt: Date.now() + 30000 }
        sendToClient(verifyRoom.playerA, endMsg)
        verifyRoom.spectators?.forEach(s => sendToClient(s, endMsg as any))
      } else if (winner) {
        verifyRoom.status = "finished"
        verifyRoom.gameEndExpiresAt = Date.now() + 30000
        const wc = winner.winnerColor as "red" | "black"
        const reason = `${wc === "red" ? "Red" : "Black"} wins by ${winner.result}`
        const endMsg: ServerMessage = { type: "gameEnd", result: winner.result, winnerColor: wc, reason, expiresAt: Date.now() + 30000 }
        sendToClient(verifyRoom.playerA, endMsg)
        verifyRoom.spectators?.forEach(s => sendToClient(s, endMsg as any))
      }

      // Schedule next bot move if game continues (but only if it's still bot's turn)
      if (verifyRoom.status === "playing" && verifyRoom.gameState.turn === botColor) {
        scheduleBotMove(roomId)
      }
    }

    worker.onerror = (err) => {
      worker.terminate()
      console.error(JSON.stringify({ event: "bot-worker-error", roomId, error: err.message }))
    }
  }, delay)

  botTimeouts.set(roomId, timeout)
}

function broadcastRoomUpdate(roomId: string) {
  const room = getRoom(roomId)
  if (!room) return

  const players = [
    {
      clientId: room.playerA,
      ready: room.playerAReady,
      name: getClientName(room.playerA),
    },
  ]
  if (room.playerB) {
    players.push({
      clientId: room.playerB,
      ready: room.playerBReady,
      name: getClientName(room.playerB),
    })
  }

  const spectators = room.spectators || []
  const payload = {
    type: "roomUpdate",
    players,
    roomStatus: room.status,
    spectators,
  }

  sendToClient(room.playerA, payload)
  if (room.playerB) {
    sendToClient(room.playerB, payload)
  }
  // Also notify spectators
  spectators.forEach(spectatorId => {
    sendToClient(spectatorId, payload)
  })
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
        } else if (action === "setName") {
          const name = data.name as string
          result = handleSetName({ clientId: myClientId, name })
        } else if (action === "createBotRoom") {
          result = allActions.createBotRoom({
            clientId: myClientId,
            room: null as any,
            roomId: "",
            send: sendToClient,
            broadcastLobby: broadcastLobbyUpdate,
            difficulty: data.difficulty as string,
          } as any)
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

        // Bot scheduling: after a human move in a bot room, schedule bot response
        if (action === "move" && data.roomId) {
          const roomId = data.roomId as string
          const room = getRoom(roomId)
          if (room && isBotRoom(roomId) && room.gameState) {
            scheduleBotMove(roomId)
          }
        }

        // Bot scheduling: after creating bot room, schedule bot if it's bot's turn
        if (action === "createBotRoom" && result.kind === "ok") {
          // Find the roomId from the roomCreated notification
          for (const n of result.notifications) {
            if (n.kind === "send" && n.message.type === "roomCreated") {
              const roomId = (n.message as { roomId: string }).roomId
              const room = getRoom(roomId)
              if (room && isBotRoom(roomId) && room.gameState) {
                scheduleBotMove(roomId)
              }
              break
            }
          }
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
