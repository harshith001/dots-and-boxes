# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development (from repo root)
```bash
npm run dev              # Run frontend + backend concurrently
npm run dev:frontend     # Next.js on :3000 only
npm run dev:backend      # Node.js on :3001 only
```

### Frontend (`cd frontend`)
```bash
npm run dev              # Dev server
npm run build            # Production build
npm run lint             # ESLint
npm test                 # Vitest (all tests)
npx vitest run <file>    # Single test file
```

### Backend (`cd backend`)
```bash
npm run dev              # tsx watch (auto-restart)
npm run build            # tsc → dist/
npm run start            # node dist/index.js
```

### Environment
- Frontend: `NEXT_PUBLIC_BACKEND_URL` (default `http://localhost:3001`)
- Backend: `PORT` (default `3001`), `FRONTEND_URL` (default `http://localhost:3000`), `DB_PATH` (default `data/game.db`)

## Architecture

**Dots & Boxes** is a real-time multiplayer grid game. Players take turns drawing lines; completing a box scores a point and grants an extra turn.

### Stack
- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Zustand + Socket.io-client + Vitest
- **Backend**: Express 5 + Socket.io + TypeScript + better-sqlite3
- **Database**: SQLite at `data/game.db` (WAL mode, persisted on disk)

### Key Directories
```
frontend/
  app/              # Next.js pages: /, /lobby, /game/[roomId], /room/[roomId], /dashboard, /leaderboard
  components/game/  # GameBoard, PlayerCard, EmojiPanel, ChatPanel, TurnLabel
  lib/              # api.ts (HTTP), socket.ts (WS singleton), gameLogic.ts, gridGeometry.ts
  store/gameStore.ts # Zustand store — all game + multiplayer state
  types/game.ts     # Shared frontend types

backend/src/
  index.ts          # Express routes + Socket.io event handlers
  rooms.ts          # RoomManager — in-memory Map of rooms
  gameEngine.ts     # Stateless move application (mirrors frontend gameLogic.ts)
  db.ts             # SQLite layer with 30s leaderboard cache
  bot.ts            # Random-move bot with 600ms delay
  types.ts          # Backend types
```

### Multiplayer Protocol
- **Player identity**: `playerToken` (UUID in sessionStorage) persists across reconnects; Socket ID changes on reconnect
- **Room lifecycle**: `waiting → active → finished`
- **Matchmaking**: `queue:join` → pair players or start 5s bot-fallback timer
- **Gameplay**: `room:move` → server validates + applies → broadcasts `game:state` to room
- **Social**: `emoji:send` / `chat:send` → broadcast with 2s dedup on emoji

### Game State
```typescript
interface LocalGameState {
  hLines: (Player | null)[][];   // [row][col]
  vLines: (Player | null)[][];   // [row][col]
  boxes:  (Player | null)[][];   // [row][col]
  scores: { p1: number; p2: number };
  currentTurn: Player;           // 'p1' | 'p2'
  status: 'active' | 'finished';
  winner: Player | 'draw' | null;
  gridSize: number;              // 5, 9, or 13
}
```

### Critical Design Choices
- Game logic is intentionally **duplicated** between `frontend/lib/gameLogic.ts` and `backend/src/gameEngine.ts` — the backend is authoritative; the frontend applies optimistic updates.
- Rooms are **in-memory only** — they do not survive server restarts. Match results are persisted to SQLite on game end.
- Types are duplicated between `frontend/types/game.ts` and `backend/src/types.ts` — planned to move to `shared/` in a future phase.
- REST API (`/api/session`, `/api/stats/:username`, `/api/leaderboard`) is separate from Socket.io — HTTP for init/stats, WebSocket for gameplay.

### Database Schema
```sql
players (username PK, created_at)
matches (id PK, player1, player2, winner, score_p1, score_p2, played_at)
-- Indexes on matches.player1, player2, played_at DESC
```
