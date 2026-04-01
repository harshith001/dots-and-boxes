import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '../../data/game.db');

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    username   TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS matches (
    id         TEXT PRIMARY KEY,
    player1    TEXT NOT NULL,
    player2    TEXT NOT NULL,
    winner     TEXT,
    score_p1   INTEGER NOT NULL DEFAULT 0,
    score_p2   INTEGER NOT NULL DEFAULT 0,
    played_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (player1) REFERENCES players(username),
    FOREIGN KEY (player2) REFERENCES players(username)
  );

  CREATE INDEX IF NOT EXISTS idx_matches_player1 ON matches(player1);
  CREATE INDEX IF NOT EXISTS idx_matches_player2 ON matches(player2);
  CREATE INDEX IF NOT EXISTS idx_matches_played_at ON matches(played_at DESC);
`);

// Migration: add grid_size column if it doesn't exist
const existingColumns = (db.pragma('table_info(matches)') as Array<{ name: string }>).map(c => c.name);
if (!existingColumns.includes('grid_size')) {
  db.exec('ALTER TABLE matches ADD COLUMN grid_size INTEGER NOT NULL DEFAULT 5');
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface PlayerStats {
  username: string;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

export interface GridBreakdown {
  gridSize: number;
  matches: number;
  wins: number;
  winRate: number;
}

export interface ExtendedStats {
  currentStreak: number;
  avgScore: number;
  perGrid: GridBreakdown[];
}

export interface MatchRecord {
  id: string;
  player1: string;
  player2: string;
  winner: string | null;
  score_p1: number;
  score_p2: number;
  played_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  wins: number;
  totalMatches: number;
  winRate: number;
}

// ── Prepared statements ────────────────────────────────────────────────────

const stmtUpsertPlayer = db.prepare(`
  INSERT INTO players (username) VALUES (?)
  ON CONFLICT (username) DO NOTHING
`);

const stmtRecordMatch = db.prepare(`
  INSERT INTO matches (id, player1, player2, winner, score_p1, score_p2, grid_size)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const stmtGetPlayerStats = db.prepare(`
  SELECT
    ? AS username,
    COUNT(*) AS totalMatches,
    SUM(CASE WHEN winner = ? THEN 1 ELSE 0 END) AS wins,
    SUM(CASE WHEN winner IS NOT NULL AND winner != ? THEN 1 ELSE 0 END) AS losses,
    SUM(CASE WHEN winner IS NULL THEN 1 ELSE 0 END) AS draws
  FROM matches
  WHERE player1 = ? OR player2 = ?
`);

const stmtGetMatchHistory = db.prepare(`
  SELECT id, player1, player2, winner, score_p1, score_p2, played_at
  FROM matches
  WHERE player1 = ? OR player2 = ?
  ORDER BY played_at DESC
  LIMIT 10
`);

const stmtGetStreakHistory = db.prepare(`
  SELECT winner, player1, player2
  FROM matches
  WHERE player1 = ? OR player2 = ?
  ORDER BY played_at DESC
  LIMIT 50
`);

const stmtGetAvgScore = db.prepare(`
  SELECT AVG(CASE WHEN player1 = ? THEN score_p1 ELSE score_p2 END) AS avgScore
  FROM matches
  WHERE player1 = ? OR player2 = ?
`);

const stmtGetPerGrid = db.prepare(`
  SELECT
    grid_size AS gridSize,
    COUNT(*) AS matches,
    SUM(CASE WHEN winner = ? THEN 1 ELSE 0 END) AS wins
  FROM matches
  WHERE player1 = ? OR player2 = ?
  GROUP BY grid_size
  ORDER BY grid_size
`);

const stmtGetLeaderboardRaw = db.prepare(`
  SELECT
    p.username,
    COUNT(m.id) AS totalMatches,
    SUM(CASE WHEN m.winner = p.username THEN 1 ELSE 0 END) AS wins
  FROM players p
  LEFT JOIN matches m ON (m.player1 = p.username OR m.player2 = p.username)
  WHERE p.username NOT LIKE '%_BOT'
  GROUP BY p.username
  ORDER BY wins DESC, totalMatches DESC
  LIMIT 50
`);

// ── Leaderboard cache (30s TTL) ────────────────────────────────────────────

let leaderboardCache: LeaderboardEntry[] | null = null;
let leaderboardCachedAt = 0;
const LEADERBOARD_TTL_MS = 30_000;

// ── Exported functions ─────────────────────────────────────────────────────

export function upsertPlayer(username: string): void {
  stmtUpsertPlayer.run(username);
}

export function recordMatch(
  id: string,
  player1: string,
  player2: string,
  winner: string | null,
  scoreP1: number,
  scoreP2: number,
  gridSize: number,
): void {
  stmtRecordMatch.run(id, player1, player2, winner, scoreP1, scoreP2, gridSize);
  // Invalidate leaderboard cache on new match
  leaderboardCache = null;
}

export function getPlayerStats(username: string): PlayerStats {
  const row = stmtGetPlayerStats.get(username, username, username, username, username) as {
    username: string;
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
  } | undefined;

  if (!row || row.totalMatches === 0) {
    return { username, totalMatches: 0, wins: 0, losses: 0, draws: 0, winRate: 0 };
  }

  const wins = row.wins ?? 0;
  const losses = row.losses ?? 0;
  const draws = row.draws ?? 0;
  const total = row.totalMatches ?? 0;

  return {
    username,
    totalMatches: total,
    wins,
    losses,
    draws,
    winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
  };
}

export function getMatchHistory(username: string): MatchRecord[] {
  return stmtGetMatchHistory.all(username, username) as MatchRecord[];
}

export function getExtendedStats(username: string): ExtendedStats {
  // Current win streak
  const streakRows = stmtGetStreakHistory.all(username, username) as Array<{
    winner: string | null; player1: string; player2: string;
  }>;
  let currentStreak = 0;
  for (const row of streakRows) {
    if (row.winner === username) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Avg score
  const avgRow = stmtGetAvgScore.get(username, username, username) as { avgScore: number | null };
  const avgScore = avgRow?.avgScore != null ? Math.round(avgRow.avgScore * 10) / 10 : 0;

  // Per-grid breakdown
  const gridRows = stmtGetPerGrid.all(username, username, username) as Array<{
    gridSize: number; matches: number; wins: number;
  }>;
  const perGrid: GridBreakdown[] = gridRows.map(r => ({
    gridSize: r.gridSize,
    matches: r.matches,
    wins: r.wins ?? 0,
    winRate: r.matches > 0 ? Math.round(((r.wins ?? 0) / r.matches) * 100) : 0,
  }));

  return { currentStreak, avgScore, perGrid };
}

export function getLeaderboard(): LeaderboardEntry[] {
  const now = Date.now();
  if (leaderboardCache && now - leaderboardCachedAt < LEADERBOARD_TTL_MS) {
    return leaderboardCache;
  }

  const rows = stmtGetLeaderboardRaw.all() as {
    username: string;
    totalMatches: number;
    wins: number;
  }[];

  leaderboardCache = rows.map((row, i) => ({
    rank: i + 1,
    username: row.username,
    wins: row.wins ?? 0,
    totalMatches: row.totalMatches ?? 0,
    winRate: row.totalMatches > 0
      ? Math.round(((row.wins ?? 0) / row.totalMatches) * 100)
      : 0,
  }));
  leaderboardCachedAt = now;

  return leaderboardCache;
}
