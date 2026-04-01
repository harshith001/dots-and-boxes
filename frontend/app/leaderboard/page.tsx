'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getLeaderboard, getSession } from '../../lib/api';
import type { LeaderboardEntry } from '../../lib/api';
import { SideNav } from '../../components/SideNav';

export default function LeaderboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    const data = await getLeaderboard().catch(() => null);
    if (data) {
      setEntries(data.leaderboard);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    getSession().then(session => {
      if (!session?.operatorName) { router.replace('/'); return; }
      setUsername(session.operatorName);
    });
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30_000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard, router]);

  const myEntry = entries.find(e => e.username === username);

  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex items-center px-6 h-14 bg-surface-container-lowest border-b border-outline-variant/10">
        <div className="flex flex-col flex-1">
          <span className="font-label text-[9px] uppercase tracking-widest text-primary-fixed">LEADERBOARD</span>
          <span className="font-headline text-sm font-semibold text-on-surface">{username ?? '...'}</span>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="font-label text-[8px] uppercase tracking-widest text-secondary/30">
              UPDATED {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => router.push('/lobby')}
            className="flex items-center gap-2 h-9 px-4 bg-primary-fixed font-label text-[10px] uppercase tracking-widest text-on-primary-fixed font-bold hover:bg-primary-fixed-dim transition-colors"
          >
            <span className="material-symbols-outlined text-sm leading-none">sports_esports</span>
            PLAY NOW
          </button>
        </div>
      </header>

      <SideNav active="leaderboard" />

      {/* Main */}
      <main className="pl-16 pt-14 min-h-screen">
        <div className="absolute inset-0 dot-grid opacity-[0.02] pointer-events-none" />
        <div className="relative z-10 p-6 flex flex-col gap-5 max-w-2xl">

          {/* My rank callout */}
          {myEntry && (
            <div className="bg-surface-container-low border border-primary-fixed/20 flex items-center gap-4 px-4 h-12 relative">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-fixed" />
              <span className="font-label text-[9px] uppercase tracking-widest text-primary-fixed/60">YOUR RANK</span>
              <span className="font-headline text-2xl font-bold text-primary-fixed leading-none">
                #{String(myEntry.rank).padStart(2, '0')}
              </span>
              <div className="h-4 w-px bg-outline-variant/20" />
              <span className="font-headline text-sm font-semibold text-on-surface">{myEntry.username}</span>
              <div className="ml-auto flex items-center gap-4">
                <span className="font-label text-[9px] text-secondary/50">{myEntry.wins}W</span>
                <span className="font-label text-[9px] text-secondary/50">{myEntry.totalMatches} MATCHES</span>
                <span className="font-label text-[9px] font-bold text-primary-fixed">{myEntry.winRate}% WIN</span>
              </div>
            </div>
          )}

          {/* Rankings table */}
          <div className="bg-surface-container-low border border-outline-variant/10 flex flex-col">
            <div className="flex items-center justify-between px-4 h-11 bg-surface-container border-b border-outline-variant/10 shrink-0">
              <span className="font-label text-[9px] uppercase tracking-widest text-primary-fixed">GLOBAL RANKINGS</span>
              <span className="font-label text-[8px] uppercase tracking-widest text-secondary/20">AUTO_REFRESH: 30S</span>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[40px_1fr_60px_80px_70px] px-4 h-9 items-center bg-surface-container-lowest border-b border-outline-variant/10 shrink-0">
              {['#', 'OPERATOR', 'WINS', 'MATCHES', 'WIN %'].map(h => (
                <span key={h} className="font-label text-[8px] uppercase tracking-widest text-secondary/40">{h}</span>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <span className="font-label text-[9px] uppercase tracking-widest text-secondary/30 animate-pulse">FETCHING_GRID_DATA...</span>
              </div>
            ) : entries.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <span className="font-label text-[9px] uppercase tracking-widest text-secondary/30">NO_OPERATORS_RANKED</span>
              </div>
            ) : (
              <div className="overflow-y-auto">
                {entries.map(e => {
                  const isTop3 = e.rank <= 3;
                  const isMe = e.username === username;
                  return (
                    <div
                      key={e.username}
                      className={`grid grid-cols-[40px_1fr_60px_80px_70px] px-4 h-12 items-center border-b border-outline-variant/5 transition-colors ${
                        isMe
                          ? 'bg-surface-container border border-primary-fixed/20'
                          : isTop3
                            ? 'hover:bg-primary-fixed/5'
                            : 'hover:bg-surface-container/40'
                      }`}
                    >
                      <span className={`font-label text-[10px] font-bold ${isTop3 ? 'text-primary-fixed' : 'text-secondary/40'}`}>
                        {String(e.rank).padStart(2, '0')}
                      </span>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`font-headline text-sm font-semibold truncate ${isMe ? 'text-primary-fixed' : isTop3 ? 'text-on-surface' : 'text-secondary'}`}>
                          {e.username}
                        </span>
                        {e.rank === 1 && (
                          <span className="font-label text-[8px] uppercase tracking-widest text-primary-fixed/70 shrink-0">CHAMPION</span>
                        )}
                        {isMe && (
                          <span className="font-label text-[8px] font-bold text-on-primary-fixed bg-primary-fixed px-1.5 py-0.5 shrink-0">YOU</span>
                        )}
                      </div>
                      <span className={`font-label text-xs font-bold ${isTop3 ? 'text-primary-fixed' : 'text-on-surface'}`}>
                        {e.wins}
                      </span>
                      <span className="font-label text-xs text-secondary/60">{e.totalMatches}</span>
                      <span className="font-label text-xs text-secondary/60">{e.winRate}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
