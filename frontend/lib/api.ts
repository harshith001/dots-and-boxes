const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export interface SessionResponse {
  operatorName: string;
}

export interface PlayerStats {
  username: string;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
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

export interface StatsResponse {
  stats: PlayerStats;
  history: MatchRecord[];
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function postSession(name: string): Promise<SessionResponse> {
  return apiFetch<SessionResponse>('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export async function getSession(): Promise<SessionResponse | null> {
  try {
    return await apiFetch<SessionResponse>('/api/session');
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  await apiFetch('/api/session', { method: 'DELETE' });
}

export async function getStats(username: string): Promise<StatsResponse> {
  return apiFetch<StatsResponse>(`/api/stats/${encodeURIComponent(username)}`);
}

export async function getLeaderboard(): Promise<LeaderboardResponse> {
  return apiFetch<LeaderboardResponse>('/api/leaderboard');
}
