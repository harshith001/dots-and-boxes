'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, getStats } from '../../lib/api';
import type { PlayerStats, MatchRecord } from '../../lib/api';

function SideNav({ active }: { active: 'dashboard' | 'leaderboard' | 'lobby' }) {
  const router = useRouter();
  const links = [
    { key: 'lobby', label: 'GRID', icon: 'grid_view', href: '/lobby' },
    { key: 'leaderboard', label: 'LB', icon: 'leaderboard', href: '/leaderboard' },
    { key: 'dashboard', label: 'DASH', icon: 'bar_chart', href: '/dashboard' },
  ] as const;
  return (
    <nav className="fixed left-0 top-14 bottom-0 w-16 bg-surface-container-low border-r border-outline-variant/10 flex flex-col items-center pt-6 gap-6 z-40">
      {links.map(l => (
        <button
          key={l.key}
          onClick={() => router.push(l.href)}
          className={`flex flex-col items-center gap-1 group transition-colors ${active === l.key ? 'text-primary-fixed' : 'text-secondary hover:text-primary'}`}
        >
          <span className="material-symbols-outlined text-xl">{l.icon}</span>
          <span className="font-label text-[8px] tracking-widest uppercase">{l.label}</span>
        </button>
      ))}
    </nav>
  );
}

interface StatCardProps { label: string; value: string | number; sub?: string }
function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-surface-container-high/40 border border-outline-variant/10 p-6">
      <p className="font-label text-[9px] uppercase tracking-widest text-secondary/60 mb-2">{label}</p>
      <p className="font-headline text-3xl font-bold text-primary-fixed">{value}</p>
      {sub && <p className="font-label text-[9px] uppercase tracking-wider text-secondary/40 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then(async session => {
      if (!session?.operatorName) {
        router.replace('/');
        return;
      }
      setUsername(session.operatorName);
      const data = await getStats(session.operatorName).catch(() => null);
      if (data) {
        setStats(data.stats);
        setHistory(data.history);
      }
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

  return (
    <div className="min-h-screen bg-background text-primary font-body">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-14 bg-surface border-b border-surface-variant/20">
        <div className="flex items-center gap-4">
          <span className="font-headline font-bold tracking-tighter text-primary text-lg">MONOCHROME_KINETIC_V1.0</span>
          <div className="h-4 w-px bg-outline-variant opacity-20" />
          <span className="font-label uppercase tracking-tight text-xs text-secondary">
            OPERATOR: <span className="text-primary-fixed">{username}</span>
          </span>
        </div>
        <span className="font-label text-[10px] uppercase tracking-widest text-secondary/40">DASHBOARD</span>
      </header>

      <SideNav active="dashboard" />

      {/* Main */}
      <main className="pl-16 pt-14 min-h-screen">
        <div className="absolute inset-0 dot-grid opacity-[0.02] pointer-events-none" />
        <div className="relative z-10 p-8 max-w-4xl">
          <div className="mb-8">
            <p className="font-label text-[9px] uppercase tracking-widest text-secondary/40 mb-1">OPERATOR_PROFILE</p>
            <h1 className="font-headline text-2xl font-bold tracking-tighter text-primary">{username}</h1>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            <StatCard label="TOTAL_MATCHES" value={stats?.totalMatches ?? 0} />
            <StatCard label="VICTORIES" value={stats?.wins ?? 0} />
            <StatCard label="DEFEATS" value={stats?.losses ?? 0} />
            <StatCard label="WIN_RATE" value={`${stats?.winRate ?? 0}%`} sub={`${stats?.draws ?? 0} DRAWS`} />
          </div>

          {/* Match history */}
          <div className="bg-surface-container-high/40 border border-outline-variant/10">
            <div className="px-6 py-4 border-b border-outline-variant/10">
              <span className="font-label text-[9px] uppercase tracking-widest text-secondary/60">MATCH_HISTORY // LAST 10</span>
            </div>
            {history.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <span className="font-label text-[9px] uppercase tracking-widest text-secondary/30">NO_MATCHES_RECORDED</span>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    {['OPPONENT', 'RESULT', 'SCORE', 'DATE'].map(h => (
                      <th key={h} className="px-6 py-3 text-left font-label text-[8px] uppercase tracking-widest text-secondary/40">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map(m => {
                    const isP1 = m.player1 === username;
                    const opponent = isP1 ? m.player2 : m.player1;
                    const myScore = isP1 ? m.score_p1 : m.score_p2;
                    const oppScore = isP1 ? m.score_p2 : m.score_p1;
                    const result = m.winner === null ? 'DRAW' : m.winner === username ? 'WIN' : 'LOSS';
                    const badge =
                      result === 'WIN' ? 'text-primary-fixed border border-primary-fixed/30 bg-primary-fixed/10' :
                      result === 'LOSS' ? 'text-red-400 border border-red-400/30 bg-red-400/10' :
                      'text-secondary border border-secondary/30 bg-secondary/10';
                    return (
                      <tr key={m.id} className="border-b border-outline-variant/5 hover:bg-surface-container/30 transition-colors">
                        <td className="px-6 py-3 font-headline text-sm text-primary">{opponent}</td>
                        <td className="px-6 py-3">
                          <span className={`font-label text-[9px] uppercase tracking-widest px-2 py-0.5 ${badge}`}>{result}</span>
                        </td>
                        <td className="px-6 py-3 font-label text-xs text-secondary">{myScore} — {oppScore}</td>
                        <td className="px-6 py-3 font-label text-[9px] text-secondary/40">
                          {new Date(m.played_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
