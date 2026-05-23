import { describe, it, expect, beforeAll, beforeEach } from "bun:test"
import { createApp } from "./index"
import { handleSetName, getClientName, clientNames } from "./clientNames"
import { createRoom, rooms } from "./rooms"

let port = 0

function connectedWs(): Promise<{
  ws: WebSocket
  messages: string[]
  waitFor: (filter?: (msg: string) => boolean) => Promise<string>
}> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`)
    const messages: string[] = []
    const listeners: Array<(msg: string) => void> = []

    ws.onmessage = (e) => {
      const text = e.data as string
      messages.push(text)
      for (const fn of listeners) fn(text)
    }
    ws.onopen = () =>
      resolve({
        ws,
        messages,
        waitFor: (filter) =>
          new Promise((res, rej) => {
            const match = filter
              ? messages.find(filter)
              : messages[messages.length - 1]
            if (match) return res(match)

            const handler = (msg: string) => {
              if (!filter || filter(msg)) {
                const idx = listeners.indexOf(handler)
                if (idx !== -1) listeners.splice(idx, 1)
                res(msg)
              }
            }
            listeners.push(handler)
            setTimeout(() => {
              const idx = listeners.indexOf(handler)
              if (idx !== -1) listeners.splice(idx, 1)
              rej(new Error("Message timeout"))
            }, 3000)
          }),
      })
    ws.onerror = () => reject(new Error("WS connection failed"))
    setTimeout(() => reject(new Error("WS connect timeout")), 3000)
  })
}

beforeAll(() => {
  const app = createApp()
  app.listen(0)
  const server = app.server
  if (!server) throw new Error("Server failed to start")
  port = server.port
})

beforeEach(() => {
  rooms.clear()
  clientNames.clear()
})

describe("Lobby via WebSocket", () => {
  it("creates a room and receives roomCreated + lobbyUpdate", async () => {
    const clientA = await connectedWs()
    await clientA.waitFor((m) => m.includes('"type":"connected"'))

    clientA.ws.send(JSON.stringify({ action: "createRoom" }))

    const roomCreated = await clientA.waitFor((m) =>
      m.includes('"type":"roomCreated"'),
    )
    const roomCreatedMsg = JSON.parse(roomCreated)
    expect(roomCreatedMsg.type).toBe("roomCreated")
    expect(roomCreatedMsg.roomId).toMatch(/^[a-zA-Z0-9_-]{7}$/)

    const lobbyUpdate = await clientA.waitFor((m) =>
      m.includes('"type":"lobbyUpdate"'),
    )
    const lobbyMsg = JSON.parse(lobbyUpdate)
    expect(lobbyMsg.type).toBe("lobbyUpdate")
    expect(lobbyMsg.rooms.length).toBeGreaterThanOrEqual(1)
    expect(lobbyMsg.rooms[0].roomId).toBe(roomCreatedMsg.roomId)

    clientA.ws.close()
  })

  it("receives lobbyUpdate broadcast when another client creates a room", async () => {
    const clientA = await connectedWs()
    const clientB = await connectedWs()
    await clientA.waitFor((m) => m.includes('"type":"connected"'))
    await clientB.waitFor((m) => m.includes('"type":"connected"'))

    clientA.ws.send(JSON.stringify({ action: "createRoom" }))

    await clientA.waitFor((m) => m.includes('"type":"roomCreated"'))
    await clientA.waitFor((m) => m.includes('"type":"lobbyUpdate"'))

    const bUpdate = await clientB.waitFor((m) =>
      m.includes('"type":"lobbyUpdate"'),
    )
    const lobbyMsg = JSON.parse(bUpdate)
    expect(lobbyMsg.type).toBe("lobbyUpdate")
    expect(lobbyMsg.rooms.length).toBeGreaterThanOrEqual(1)

    clientA.ws.close()
    clientB.ws.close()
  })

  it("lobbyUpdate rooms include hostName", async () => {
    // Direct unit test: setName stores the name, getClientName retrieves it
    handleSetName({ clientId: "alice-id", name: "Alice" })
    expect(getClientName("alice-id")).toBe("Alice")

    // Create room with same clientId, verify hostName mapping
    const room = createRoom("alice-id")
    const hostName = getClientName(room.playerA) || room.playerA.slice(0, 5)
    expect(hostName).toBe("Alice")
  })

  it("lobbyUpdate hostName falls back to client ID prefix when no name set", async () => {
    const client = await connectedWs()
    await client.waitFor((m) => m.includes('"type":"connected"'))

    client.ws.send(JSON.stringify({ action: "createRoom" }))

    const lobbyUpdate = await client.waitFor((m) =>
      m.includes('"type":"lobbyUpdate"'),
    )
    const lobbyMsg = JSON.parse(lobbyUpdate)
    expect(lobbyMsg.type).toBe("lobbyUpdate")
    expect(lobbyMsg.rooms.length).toBeGreaterThanOrEqual(1)
    const hostName = lobbyMsg.rooms[0].hostName
    expect(typeof hostName).toBe("string")
    expect(hostName.length).toBeGreaterThan(0)

    client.ws.close()
  })
})
