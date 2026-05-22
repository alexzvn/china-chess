# Persistent Player Display Names

Player display names (max 16 chars, Unicode) are stored server-side and persist across reconnections.

**Why:** Anonymous client IDs (nanoid strings) are unfriendly. Named players create community and accountability.

**Considered Options:**
- Local-only names — rejected: names don't survive reconnection
- Unique name enforcement — rejected: allows impersonation but simpler; duplicates allowed
- Names in Room model only — rejected: names belong to player identity, not room

**Consequences:**
- New `clientNames` Map in server state
- All messages (roomUpdate, chat, etc.) include display name
- Fall back to clientId prefix if no name set