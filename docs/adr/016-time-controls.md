# Game Time Controls

Each player has a game clock that counts down. Time control: initial time + increment per move. Timeout = loss. Undo request response time deducts from player's clock.

**Why:** Time controls are essential for tournament play. They prevent stalling and add competitive structure.

**Considered Options:**
- No time controls — rejected: essential feature
- Only countdown (no increment) — rejected: increment rewards quick play
- Client-side timer — rejected: can be manipulated, server must be source of truth

**Consequences:**
- Server tracks `timeA` and `timeB` in seconds
- Every move deducts increment from opponent's clock
- Undo requests have deadline: `expiresAt = Date.now() + RESPONSE_TIME_MS`
- If time runs out: game ends with winner by timeout