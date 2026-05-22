# Forfeit & Leave Button

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## What to build

Add a "Back to Lobby" button at the bottom of the board during active gameplay. Clicking shows confirmation dialog. Confirming counts as forfeit (loss).

## Acceptance criteria

- [ ] Game view shows "Forfeit & Leave" button during active game (status: playing)
- [ ] Clicking button shows confirmation dialog: "Are you sure? You'll forfeit the game."
- [ ] On confirm: send `leaveRoom` action with `forfeit: true`
- [ ] If host forfeits: room is deleted
- [ ] If playerB forfeits: room resets to waiting, playerB slot cleared, game state cleared
- [ ] Forfeiting counts as loss for the player (gameEnd with result: "resign")

## Blocked by

None - can start immediately