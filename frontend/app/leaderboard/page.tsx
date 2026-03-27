'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getLeaderboard } from '../../lib/api';
import type { LeaderboardEntry } from '../../lib/api';

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
          className={`flex flex-col items-center gap-1 transition-colors ${active === l.key ? 'text-primary-fixed' : 'text-secondary hover:text-primary'}`}
        >
          <span className="material-symbols-outlined text-xl">{l.icon}</span>
          <span className="font-label text-[8px] tracking-widest uppercase">{l.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    const data = await getLeaderboard().catch(() => null);
    if (data) {
      setEntries(data.leaderboard);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30_000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  return (
    <div className="min-h-screen bg-background text-primary font-body">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-14 bg-surface border-b border-surface-variant/20">
        <div className="flex items-center gap-4">
          <span className="font-headline font-bold tracking-tighter text-primary text-lg">MONOCHROME_KINETIC_V1.0</span>
          <div className="h-4 w-px bg-outline-variant opacity-20" />
          <span className="font-label uppercase tracking-tight text-xs text-secondary">
            SYSTEM_STATUS: <span className="text-primary-fixed">OPERATIONAL</span>
          </span>
        </div>
        <span className="font-label text-[10px] uppercase tracking-widest text-secondary/40">LEADERBOARD</span>
      </header>

      <SideNav active="leaderboard" />

      {/* Main */}
      <main className="pl-16 pt-14 min-h-screen">
        <div className="absolute inset-0 dot-grid opacity-[0.02] pointer-events-none" />
        <div className="relative z-10 p-8 max-w-3xl">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="font-label text-[9px] uppercase tracking-widest text-secondary/40 mb-1">GLOBAL_RANKINGS</p>
              <h1 className="font-headline text-2xl font-bold tracking-tighter text-primary">LEADERBOARD</h1>
            </div>
            {lastUpdated && (
              <span className="font-label text-[8px] uppercase tracking-widest text-secondary/30">
                UPDATED {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>

          <div className="bg-surface-container-high/40 border border-outline-variant/10">
            <div className="px-6 py-4 border-b border-outline-variant/10">
              <span className="font-label text-[9px] uppercase tracking-widest text-secondary/60">OPERATOR_RANKINGS // TOP 50</span>
            </div>

            {loading ? (
              <div className="px-6 py-8 text-center">
                <span className="font-label text-[9px] uppercase tracking-widest text-secondary/30 animate-pulse">FETCHING_GRID_DATA...</span>
              </div>
            ) : entries.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <span className="font-label text-[9px] uppercase tracking-widest text-secondary/30">NO_OPERATORS_RANKED</span>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    {['#', 'OPERATOR', 'WINS', 'MATCHES', 'WIN_RATE'].map(h => (
                      <th key={h} className="px-6 py-3 text-left font-label text-[8px] uppercase tracking-widest text-secondary/40">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => {
                    const isTop3 = e.rank <= 3;
                    return (
                      <tr
                        key={e.username}
                        className={`border-b border-outline-variant/5 transition-colors ${
                          isTop3
                            ? 'bg-primary-fixed/5 border-l-2 border-l-primary-fixed hover:bg-primary-fixed/10'
                            : 'hover:bg-surface-container/30'
                        }`}
                      >
                        <td className={`px-6 py-3 font-headline text-sm font-bold ${isTop3 ? 'text-primary-fixed' : 'text-secondary/40'}`}>
                          {e.rank}
                        </td>
                        <td className={`px-6 py-3 font-headline text-sm ${isTop3 ? 'text-primary' : 'text-secondary'}`}>
                          {e.username}
                          {e.rank === 1 && <span className="ml-2 font-label text-[8px] uppercase tracking-widest text-primary-fixed/70">CHAMPION</span>}
                        </td>
                        <td className={`px-6 py-3 font-label text-xs font-bold ${isTop3 ? 'text-primary-fixed' : 'text-primary'}`}>
                          {e.wins}
                        </td>
                        <td className="px-6 py-3 font-label text-xs text-secondary/60">{e.totalMatches}</td>
                        <td className="px-6 py-3 font-label text-xs text-secondary/60">{e.winRate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <span className="font-label text-[8px] uppercase tracking-widest text-secondary/20">AUTO_REFRESH: 30S</span>
          </div>
        </div>
      </main>
    </div>
  );
}
