'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, getStats, getLeaderboard } from '../../lib/api';
import type { PlayerStats, MatchRecord, LeaderboardEntry, ExtendedStats } from '../../lib/api';
import { SideNav } from '../../components/SideNav';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}
function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className={`relative p-5 flex flex-col gap-2 ${accent ? 'bg-surface-container-low border border-primary-fixed/20' : 'bg-surface-container-low border border-outline-variant/10'}`}>
      {accent && <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-fixed" />}
      <p className={`font-label text-[9px] uppercase tracking-widest ${accent ? 'text-primary-fixed' : 'text-secondary/60'}`}>{label}</p>
      <p className={`font-headline text-4xl font-bold leading-none ${accent ? 'text-primary-fixed' : 'text-on-surface'}`}>{value}</p>
      {sub && <p className="font-label text-[9px] uppercase tracking-wider text-secondary/40 mt-auto">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [extended, setExtended] = useState<ExtendedStats | null>(null);
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then(async session => {
      if (!session?.operatorName) {
        router.replace('/');
        return;
      }
      setUsername(session.operatorName);
      const [statsData, lbData] = await Promise.all([
        getStats(session.operatorName).catch(() => null),
        getLeaderboard().catch(() => null),
      ]);
      if (statsData) {
        setStats(statsData.stats);
        setHistory(statsData.history);
        setExtended(statsData.extended);
      }
      if (lbData) setLeaderboard(lbData.leaderboard);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="font-label text-[10px] uppercase tracking-widest text-secondary/40 animate-pulse">
          LOADING_OPERATOR_DATA...
        </span>
      </div>
    );
  }

  const myRank = leaderboard.find(e => e.username === username);
  const topEntries = leaderboard.slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex items-center px-6 h-14 bg-surface-container-lowest border-b border-outline-variant/10">
        <div className="flex flex-col flex-1">
          <span className="font-label text-[9px] uppercase tracking-widest text-primary-fixed">DASHBOARD</span>
          <span className="font-headline text-sm font-semibold text-on-surface">{username}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed" />
            <span className="font-label text-[9px] uppercase tracking-widest text-secondary/60">ONLINE</span>
          </div>
          <button
            onClick={() => router.push('/lobby')}
            className="flex items-center gap-2 h-9 px-4 bg-primary-fixed font-label text-[10px] uppercase tracking-widest text-on-primary-fixed font-bold hover:bg-primary-fixed-dim transition-colors"
          >
            <span className="material-symbols-outlined text-sm leading-none">sports_esports</span>
            PLAY NOW
          </button>
        </div>
      </header>

      <SideNav active="dashboard" />

      {/* Main */}
      <main className="pl-16 pt-14 min-h-screen">
        <div className="absolute inset-0 dot-grid opacity-[0.02] pointer-events-none" />
        <div className="relative z-10 flex h-[calc(100vh-56px)]">

          {/* Left/Main column */}
          <div className="flex-1 flex flex-col gap-5 p-6 overflow-y-auto min-w-0">

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="GAMES PLAYED" value={stats?.totalMatches ?? 0} sub="All time" />
              <StatCard label="WINS" value={stats?.wins ?? 0} sub={`${stats?.draws ?? 0} draws`} accent />
              <StatCard label="WIN RATE" value={`${stats?.winRate ?? 0}%`} sub={`${stats?.losses ?? 0} losses`} accent />
              <StatCard label="WIN STREAK" value={extended?.currentStreak ?? 0} sub={`Avg ${extended?.avgScore ?? 0} pts`} />
            </div>

            {/* Per-grid breakdown */}
            {extended && extended.perGrid.length > 0 && (
              <div className="bg-surface-container-low border border-outline-variant/10 flex flex-col shrink-0">
                <div className="px-4 h-11 flex items-center bg-surface-container border-b border-outline-variant/10">
                  <span className="font-label text-[9px] uppercase tracking-widest text-primary-fixed">GRID BREAKDOWN</span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-outline-variant/10">
                  {extended.perGrid.map(g => (
                    <div key={g.gridSize} className="flex flex-col items-center justify-center py-4 gap-1">
                      <span className="font-label text-[8px] uppercase tracking-widest text-secondary/40">{g.gridSize}×{g.gridSize}</span>
                      <span className="font-headline text-2xl font-bold text-on-surface leading-none">{g.winRate}%</span>
                      <span className="font-label text-[8px] text-secondary/40">{g.wins}W / {g.matches} PLAYED</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Match history */}
            <div className="flex-1 bg-surface-container-low border border-outline-variant/10 flex flex-col min-h-0">
              <div className="flex items-center justify-between px-4 h-11 bg-surface-container border-b border-outline-variant/10 shrink-0">
                <span className="font-label text-[9px] uppercase tracking-widest text-primary-fixed">RECENT MATCHES</span>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="font-label text-[9px] uppercase tracking-widest text-secondary/50 hover:text-secondary transition-colors"
                >
                  VIEW ALL
                </button>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-[1fr_90px_90px_120px] px-4 h-9 items-center bg-surface-container-lowest border-b border-outline-variant/10 shrink-0">
                {['OPPONENT', 'SCORE', 'RESULT', 'DATE'].map(h => (
                  <span key={h} className="font-label text-[8px] uppercase tracking-widest text-secondary/40">{h}</span>
                ))}
              </div>

              {history.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <span className="font-label text-[9px] uppercase tracking-widest text-secondary/30">NO_MATCHES_RECORDED</span>
                </div>
              ) : (
                <div className="overflow-y-auto">
                  {history.map(m => {
                    const isP1 = m.player1 === username;
                    const opponent = isP1 ? m.player2 : m.player1;
                    const myScore = isP1 ? m.score_p1 : m.score_p2;
                    const oppScore = isP1 ? m.score_p2 : m.score_p1;
                    const result = m.winner === null ? 'DRAW' : m.winner === username ? 'WIN' : 'LOSS';
                    const badgeClass =
                      result === 'WIN'
                        ? 'bg-primary-fixed text-on-primary-fixed'
                        : result === 'LOSS'
                          ? 'bg-surface-container-highest text-secondary'
                          : 'bg-surface-container-highest text-secondary';
                    return (
                      <div
                        key={m.id}
                        className="grid grid-cols-[1fr_90px_90px_120px] px-4 h-12 items-center border-b border-outline-variant/5 hover:bg-surface-container/40 transition-colors"
                      >
                        <span className="font-headline text-sm font-semibold text-on-surface truncate">{opponent}</span>
                        <span className="font-label text-xs text-secondary">{myScore} — {oppScore}</span>
                        <span>
                          <span className={`font-label text-[9px] uppercase tracking-widest px-2 py-0.5 font-bold ${badgeClass}`}>
                            {result}
                          </span>
                        </span>
                        <span className="font-label text-[9px] text-secondary/40">
                          {new Date(m.played_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="w-64 shrink-0 flex flex-col gap-3 p-6 pl-0 overflow-y-auto">

            {/* Leaderboard */}
            <div className="bg-surface-container-low border border-outline-variant/10 flex flex-col">
              <div className="flex items-center justify-between px-4 h-11 bg-surface-container border-b border-outline-variant/10">
                <span className="font-label text-[9px] uppercase tracking-widest text-primary-fixed">LEADERBOARD</span>
                <button
                  onClick={() => router.push('/leaderboard')}
                  className="font-label text-[9px] uppercase tracking-widest text-secondary/50 hover:text-secondary transition-colors"
                >
                  FULL →
                </button>
              </div>

              {topEntries.map(entry => (
                <div key={entry.username} className="flex items-center gap-3 px-4 h-11 border-b border-outline-variant/5">
                  <span className="font-label text-[10px] font-bold text-secondary/50 w-6 shrink-0">
                    {String(entry.rank).padStart(2, '0')}
                  </span>
                  <span className="font-headline text-sm font-semibold text-on-surface flex-1 truncate">{entry.username}</span>
                  <span className="font-label text-[10px] font-bold text-primary-fixed">{entry.wins}W</span>
                </div>
              ))}

              {/* Current player's rank */}
              {myRank && (
                <div className="flex items-center gap-3 px-4 h-11 bg-surface-container border border-primary-fixed/20">
                  <span className="font-label text-[10px] font-bold text-primary-fixed w-6 shrink-0">
                    {String(myRank.rank).padStart(2, '0')}
                  </span>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-headline text-sm font-semibold text-primary-fixed truncate">{myRank.username}</span>
                    <span className="font-label text-[8px] font-bold text-on-primary-fixed bg-primary-fixed px-1.5 py-0.5 shrink-0">YOU</span>
                  </div>
                  <span className="font-label text-[10px] font-bold text-primary-fixed">{myRank.wins}W</span>
                </div>
              )}
            </div>

            {/* Private Match CTA */}
            <div className="bg-surface-container-low border border-outline-variant/10 flex flex-col gap-3 p-4">
              <p className="font-label text-[9px] uppercase tracking-widest text-secondary/50">CHALLENGE A FRIEND</p>
              <p className="font-headline text-lg font-bold text-on-surface leading-tight">Private Match</p>
              <p className="font-label text-[10px] text-secondary/50 leading-relaxed">
                Create an invite link and challenge anyone to a 1v1
              </p>
              <button
                onClick={() => router.push('/room/new')}
                className="flex items-center justify-center gap-2 h-10 w-full bg-primary-fixed font-label text-[9px] uppercase tracking-widest text-on-primary-fixed font-bold hover:bg-primary-fixed-dim transition-colors mt-1"
              >
                <span className="material-symbols-outlined text-sm leading-none">link</span>
                CREATE INVITE
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
