# Bot Room Integration

**Status:** needs-triage
**Labels:** needs-triage, enhancement

## What to build

Integrate BotEngine into server. Allow players to create rooms against bots. Bot automatically joins, is always ready, and plays automatically after configurable delay.

## Acceptance criteria

- [ ] Server accepts `createBotRoom(difficulty)` action
- [ ] Creates room with human as playerA, bot as playerB
- [ ] Bot is automatically ready, game starts immediately
- [ ] Server runs bot move loop: after human moves, wait delay (500-1500ms), bot responds
- [ ] Bot clientId is server-managed (not real WebSocket)
- [ ] Client shows "Play vs Bot" button in Lobby
- [ ] Client opens difficulty selection modal when "Play vs Bot" clicked
- [ ] Bot difficulty displayed in room card and during game

## Blocked by

- 09-bot-engine (needs bot engine implemented first)