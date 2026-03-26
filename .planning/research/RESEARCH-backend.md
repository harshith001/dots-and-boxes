# Backend Research: Matchmaking, Storage, Leaderboard

**Project:** Dots & Boxes Multiplayer
**Focus:** Matchmaking queue, data persistence, leaderboard, session management
**Researched:** 2026-03-26
**Confidence:** MEDIUM (training data, no web search available)

---

## Matchmaking Queue

### Recommendation: In-memory queue via Socket.io room manager

For v1 with a single Node.js process, a simple in-memory queue is the correct choice.
Redis adds operational overhead that is not justified until horizontal scaling is needed.

**Pattern: Array-based queue with Socket.io pairing**

```typescript
// matchmaking.ts
interface QueueEntry {
  socketId: string;
  playerId: string;
  username: string;
  joinedAt: number;
}

const queue: QueueEntry[] = [];

export function enqueue(entry: QueueEntry): void {
  queue.push(entry);
  tryMatch();
}

export function dequeue(socketId: string): void {
  const idx = queue.findIndex(e => e.socketId === socketId);
  if (idx !== -1) queue.splice(idx, 1);
}

function tryMatch(): void {
  if (queue.length < 2) return;
  const [p1, p2] = queue.splice(0, 2);
  createMatch(p1, p2);
}
```

**Key rules:**
- Remove player from queue on `disconnect` event — always.
- Debounce `tryMatch` is unnecessary for small-scale; call it synchronously after every enqueue.
- Never mutate queue entries; replace them if state changes.

### Room-based Invite System

Generate a short random room code (6-char alphanumeric). Store pending rooms in a `Map<roomCode, PendingRoom>`.

```typescript
interface PendingRoom {
  hostSocketId: string;
  hostPlayerId: string;
  createdAt: number;
}

const pendingRooms = new Map<string, PendingRoom>();

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
```

Expire pending rooms after 10 minutes with a simple `setTimeout` cleanup.
The shareable link is `https://yourdomain.com/join/{roomCode}`.

---

## Storage Recommendation

### v1: SQLite via better-sqlite3

**Recommendation: SQLite with better-sqlite3 (synchronous driver)**

Rationale:
- Zero-config, single file, no separate process.
- `better-sqlite3` is synchronous — no async/await complexity for simple queries.
- Sufficient for thousands of concurrent games on a single server.
- Migration path to PostgreSQL is straightforward: swap driver + minor SQL dialect changes.

**Do not use:** `sqlite3` (callback-based, worse DX). Use `better-sqlite3`.

**Migration path to PostgreSQL:**
1. Replace `better-sqlite3` with `pg` or `postgres` (node-postgres).
2. Change `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`.
3. Change `TEXT` UUIDs to `UUID` type.
4. Wrap queries in `async/await`.
5. Use a migration tool (e.g., `node-pg-migrate` or `drizzle-kit`) for schema changes.

**When to migrate:** When you need multi-process deployment, complex concurrent writes, or hosted DB services (Railway, Supabase, Neon).

---

## Data Model Schemas

```typescript
// types/models.ts

export interface Player {
  id: string;           // UUID v4
  username: string;     // unique, 3-20 chars
  createdAt: number;    // unix timestamp ms
  // Stats (denormalized on Player for fast leaderboard reads)
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;      // computed: wins / totalMatches, stored for index efficiency
}

export interface Match {
  id: string;           // UUID v4
  player1Id: string;    // FK → Player.id
  player2Id: string;    // FK → Player.id
  winnerId: string | null;  // null = draw (impossible in Dots & Boxes, but defensive)
  boardSize: number;    // e.g. 5 for 5x5 grid
  moves: Move[];        // stored as JSON blob
  startedAt: number;    // unix timestamp ms
  endedAt: number | null;
  status: 'in_progress' | 'completed' | 'abandoned';
}

export interface Move {
  playerId: string;
  line: LineId;         // encode as "h-{row}-{col}" or "v-{row}-{col}"
  timestamp: number;
  boxesCaptured: number;
}

export interface LineId {
  orientation: 'h' | 'v';
  row: number;
  col: number;
}

export interface Session {
  sessionId: string;    // UUID v4, stored in cookie
  playerId: string;     // FK → Player.id
  username: string;     // denormalized for fast lookup
  createdAt: number;
  lastSeenAt: number;
}
```

### SQLite Schema

```sql
CREATE TABLE players (
  id          TEXT PRIMARY KEY,
  username    TEXT NOT NULL UNIQUE,
  created_at  INTEGER NOT NULL,
  total_matches INTEGER NOT NULL DEFAULT 0,
  wins        INTEGER NOT NULL DEFAULT 0,
  losses      INTEGER NOT NULL DEFAULT 0,
  win_rate    REAL NOT NULL DEFAULT 0.0
);

CREATE INDEX idx_players_wins ON players(wins DESC);
CREATE INDEX idx_players_win_rate ON players(win_rate DESC);

CREATE TABLE matches (
  id          TEXT PRIMARY KEY,
  player1_id  TEXT NOT NULL REFERENCES players(id),
  player2_id  TEXT NOT NULL REFERENCES players(id),
  winner_id   TEXT REFERENCES players(id),
  board_size  INTEGER NOT NULL DEFAULT 5,
  moves       TEXT NOT NULL DEFAULT '[]',  -- JSON
  started_at  INTEGER NOT NULL,
  ended_at    INTEGER,
  status      TEXT NOT NULL DEFAULT 'in_progress'
);

CREATE INDEX idx_matches_player1 ON matches(player1_id);
CREATE INDEX idx_matches_player2 ON matches(player2_id);
CREATE INDEX idx_matches_status ON matches(status);

CREATE TABLE sessions (
  session_id  TEXT PRIMARY KEY,
  player_id   TEXT NOT NULL REFERENCES players(id),
  username    TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE INDEX idx_sessions_player ON sessions(player_id);
```

---

## Leaderboard Query Pattern

### Recommendation: Denormalized wins + win_rate on Player row

Do not compute leaderboard from aggregating the matches table on every request. Update `wins`, `losses`, `total_matches`, and `win_rate` atomically when a match ends.

```typescript
// After match ends, update winner and loser in a transaction
function recordMatchResult(
  matchId: string,
  winnerId: string,
  loserId: string
): void {
  const updateStmt = db.prepare(`
    UPDATE players
    SET
      total_matches = total_matches + 1,
      wins = wins + ?,
      losses = losses + ?,
      win_rate = CAST(wins + ? AS REAL) / (total_matches + 1)
    WHERE id = ?
  `);

  const transaction = db.transaction(() => {
    updateStmt.run(1, 0, 1, winnerId);
    updateStmt.run(0, 1, 0, loserId);
    db.prepare(`UPDATE matches SET winner_id = ?, ended_at = ?, status = 'completed' WHERE id = ?`)
      .run(winnerId, Date.now(), matchId);
  });

  transaction();
}
```

**Note on win_rate SQL:** The expression above has a flaw when total_matches is 0 initially — guard with a CASE or compute in application layer after the increment.

Safer application-layer approach:

```typescript
function computeWinRate(wins: number, totalMatches: number): number {
  if (totalMatches === 0) return 0;
  return Math.round((wins / totalMatches) * 10000) / 10000; // 4 decimal places
}
```

### Leaderboard Query

```typescript
function getLeaderboard(limit = 50, offset = 0): Player[] {
  return db.prepare(`
    SELECT id, username, total_matches, wins, losses, win_rate
    FROM players
    ORDER BY wins DESC, win_rate DESC, total_matches DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as Player[];
}
```

Primary sort by `wins` (absolute wins = clearest leaderboard metric).
Secondary sort by `win_rate` breaks ties among equal-win players.
Tertiary sort by `total_matches` rewards activity.

### Last 10 Matches

```typescript
function getRecentMatches(playerId: string, limit = 10): Match[] {
  return db.prepare(`
    SELECT * FROM matches
    WHERE (player1_id = ? OR player2_id = ?)
      AND status = 'completed'
    ORDER BY ended_at DESC
    LIMIT ?
  `).all(playerId, playerId, limit) as Match[];
}
```

---

## Session Management (Username-only, No Auth)

### Recommendation: Cookie-based session token, username stored server-side

No JWT. No OAuth. A simple opaque session ID in an HttpOnly cookie maps to a server-side session record.

**Flow:**
1. User submits username on landing page.
2. Server checks if username exists in `players` table.
   - If not: create new Player row, create Session row.
   - If exists: create new Session row for same player (allows re-login by username).
3. Set `sessionId` in `Set-Cookie: sid=...; HttpOnly; SameSite=Strict; Max-Age=604800` (7 days).
4. On every Socket.io connection, extract `sid` from the handshake cookie and resolve to Player.

**Username conflict policy:** First-come-first-served. If username is taken, prompt user to pick another. No password, so this is the only gate. For v1, this is acceptable — note it as a known limitation.

```typescript
// session middleware for Socket.io
import { parse as parseCookie } from 'cookie';

io.use((socket, next) => {
  const cookies = parseCookie(socket.handshake.headers.cookie ?? '');
  const sessionId = cookies['sid'];
  if (!sessionId) return next(new Error('No session'));

  const session = db.prepare(
    'SELECT * FROM sessions WHERE session_id = ?'
  ).get(sessionId) as Session | undefined;

  if (!session) return next(new Error('Invalid session'));

  // Attach player to socket
  (socket as any).playerId = session.playerId;
  (socket as any).username = session.username;

  // Update last_seen_at
  db.prepare('UPDATE sessions SET last_seen_at = ? WHERE session_id = ?')
    .run(Date.now(), sessionId);

  next();
});
```

**Session expiry:** Clean up sessions older than 30 days with a daily `setInterval` job.

```typescript
setInterval(() => {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  db.prepare('DELETE FROM sessions WHERE last_seen_at < ?').run(cutoff);
}, 24 * 60 * 60 * 1000);
```

---

## Stats Aggregation

Store denormalized stats on `players` row (wins, losses, total_matches, win_rate).
Compute `last_10_matches` on demand from the matches table — not stored.

For a profile endpoint:

```typescript
interface PlayerStats {
  player: Player;
  recentMatches: Array<{
    matchId: string;
    opponentUsername: string;
    result: 'win' | 'loss';
    endedAt: number;
  }>;
}
```

Join matches with players to resolve opponent username in a single query:

```sql
SELECT
  m.id AS match_id,
  m.ended_at,
  m.winner_id,
  p.username AS opponent_username
FROM matches m
JOIN players p ON p.id = CASE
  WHEN m.player1_id = :playerId THEN m.player2_id
  ELSE m.player1_id
END
WHERE (m.player1_id = :playerId OR m.player2_id = :playerId)
  AND m.status = 'completed'
ORDER BY m.ended_at DESC
LIMIT 10
```

---

## Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Queue storage | In-memory (Map/Array) | Single process v1; no Redis overhead |
| Database | SQLite + better-sqlite3 | Zero-config, sync API, easy migration path |
| Leaderboard | Denormalized on players row | O(1) write update; O(log n) sorted read |
| Session | HttpOnly cookie + server table | Simple, secure, no JWT complexity |
| Stats | Denorm totals + on-demand last 10 | Balance write speed vs query complexity |
| Room codes | 6-char alphanumeric | Human-readable, low collision at small scale |

---

## Pitfalls to Avoid

1. **Queue leak on disconnect:** Always call `dequeue(socket.id)` in the `disconnect` handler. Missing this causes ghost players in the queue blocking real matches.

2. **Race condition in tryMatch:** Node.js is single-threaded so in-memory queue is safe without locks. If you ever move to worker threads, this breaks.

3. **Computing leaderboard from aggregates at request time:** SELECT COUNT(*) with JOINs over matches table will get slow fast. The denormalized approach above is the correct pattern from day one.

4. **Storing moves as separate rows:** Store moves as a JSON blob on the match row for v1. Normalizing moves into a separate table is premature — you never query individual moves in isolation.

5. **Username squatting:** With username-only auth, users can grab any username. Document this clearly. In v2, add a PIN or email for account recovery.

6. **Not cleaning up in-memory rooms:** Set explicit TTLs on both matchmaking queue entries and pending invite rooms. A server with 10k pending rooms will OOM.

7. **SQLite WAL mode not enabled:** Default SQLite journal mode causes write contention. Enable WAL mode at startup:
   ```typescript
   db.pragma('journal_mode = WAL');
   db.pragma('synchronous = NORMAL');
   ```

---

## RESEARCH COMPLETE
