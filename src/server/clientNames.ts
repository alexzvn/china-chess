import type { ActionResult } from "./actions/types"

// Store client names in memory (could be persisted later)
export const clientNames = new Map<string, string>()

const MAX_NAME_LENGTH = 16

export interface SetNameContext {
  clientId: string
  name: string
}

export function handleSetName(ctx: SetNameContext): ActionResult {
  const name = ctx.name.trim()
  
  if (name.length > MAX_NAME_LENGTH) {
    return { kind: "error", message: "Name must be 16 characters or less" }
  }
  
  if (name.length === 0) {
    return { kind: "error", message: "Name cannot be empty" }
  }
  
  clientNames.set(ctx.clientId, name)
  return { kind: "ok", notifications: [] }
}

export function getClientName(clientId: string): string {
  return clientNames.get(clientId) ?? ""
}

export function getAllClientNames(): Map<string, string> {
  return new Map(clientNames)
}