# Extended Chinese Chess Rules

Add three tournament rules to the game engine: General face-to-face prohibition, perpetual chase detection, and insufficient material detection.

**Why:** Standard Chinese Chess requires these rules for proper gameplay. Currently the engine only validates piece movement, not these position-based rules.

**Considered Options:**
- Only face-to-face — rejected: perpetual chase and insufficient material are also common draws
- Add as optional room settings — rejected: all games should use standard rules
- Client-side only — rejected: rules must be enforced server-side

**Consequences:**
- `isValidMove` must check: does this move expose generals to face each other?
- Move history tracking: detect 3+ repetitions of same position or chasing sequence
- Material scanning: detect when neither side can checkmate (e.g., 帥+士 vs 帥)