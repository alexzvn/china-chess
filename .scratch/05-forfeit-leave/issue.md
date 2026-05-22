# Forfeit & Leave Button

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## What to build

Add a "Back to Lobby" button at the bottom of the board during active gameplay. Clicking shows confirmation dialog. Confirming counts as forfeit (loss).

## Acceptance criteria

- [x] Game view shows "Forfeit & Leave" button during active game (status: playing)
- [x] Clicking button shows confirmation dialog: "Are you sure? You'll forfeit the game."
- [x] On confirm: send `leaveRoom` action with `forfeit: true`
- [x] If host forfeits: room is deleted
- [x] If playerB forfeits: room resets to waiting, playerB slot cleared, game state cleared
- [x] Forfeiting counts as loss for the player (gameEnd with result: "resign")

## Blocked by

None - can start immediately