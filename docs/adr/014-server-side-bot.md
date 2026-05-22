# Server-side Bot Implementation

The bot will run server-side with 5 difficulty levels (Beginner, Easy, Medium, Hard, Expert), using minimax with depth varying by difficulty.

**Why:** Server-side ensures consistent behavior across all clients, prevents cheating, and allows the bot to play even when no clients are connected.

**Considered Options:**
- Client-side bot — rejected: vulnerable to manipulation, requires JS on client
- External bot service — rejected: adds infrastructure complexity
- Pre-recorded opening book + heuristics — rejected: less adaptive than minimax

**Consequences:**
- Server must run game loop for bot moves
- Bot client IDs are managed by server (not real WebSocket clients)
- Bot responds after a configurable delay (500-1500ms) to feel natural