# Spectator Support in Multiplayer Rooms

We will allow unlimited spectators in any room, separate from the 2-player slots. Spectators see board + chat, can chat, and count toward room metadata.

**Why:** Chinese Chess is often watched by others. Spectators add social value without complexity of rooms limited to 2 players.

**Considered Options:**
- Only allow spectators in public rooms — rejected: any room can be spectated
- Limit spectator count — rejected: unlimited is simpler and supports watch parties
- Spectators cannot chat — rejected: spectators enjoy interaction

**Consequences:**
- Room model now has 3 participant types: playerA, playerB, spectators[]
- All broadcast messages must include spectators
- Spectators see game state but cannot move