'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, deleteSession } from '../../lib/api';
import { SideNav } from '../../components/SideNav';

const GRID_OPTIONS = [
  { value: 5, label: '5×5', sub: 'TACTICAL' },
  { value: 9, label: '9×9', sub: 'STANDARD' },
  { value: 13, label: '13×13', sub: 'GRID WAR' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [gridSize, setGridSizeState] = useState(5);

  useEffect(() => {
    getSession().then(session => {
      if (!session?.operatorName) { router.replace('/'); return; }
      setUsername(session.operatorName);
    });
    setGridSizeState(parseInt(sessionStorage.getItem('gridSize') ?? '5'));
  }, [router]);

  function handleGridSize(size: number) {
    sessionStorage.setItem('gridSize', String(size));
    setGridSizeState(size);
  }

  async function handleLogout() {
    await deleteSession().catch(() => {});
    sessionStorage.clear();
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
      <header className="fixed top-0 w-full z-50 flex items-center px-6 h-14 bg-surface-container-lowest border-b border-outline-variant/10">
        <div className="flex flex-col flex-1">
          <span className="font-label text-[9px] uppercase tracking-widest text-primary-fixed">SETTINGS</span>
          <span className="font-headline text-sm font-semibold text-on-surface">{username ?? '...'}</span>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 font-label text-[9px] uppercase tracking-widest text-secondary/60 hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          BACK
        </button>
      </header>

      <SideNav active="settings" />

      <main className="pl-16 pt-14 min-h-screen">
        <div className="relative z-10 p-6 max-w-lg flex flex-col gap-6">

          {/* Grid size */}
          <section className="bg-surface-container-low border border-outline-variant/10">
            <div className="px-4 h-11 flex items-center bg-surface-container border-b border-outline-variant/10">
              <span className="font-label text-[9px] uppercase tracking-widest text-primary-fixed">GRID_SIZE</span>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <p className="font-label text-[9px] uppercase tracking-widest text-secondary/50 mb-2">
                Default grid for new matches
              </p>
              <div className="grid grid-cols-3 gap-3">
                {GRID_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleGridSize(opt.value)}
                    className={`flex flex-col items-center justify-center py-5 border transition-colors ${
                      gridSize === opt.value
                        ? 'border-primary-fixed bg-primary-fixed/5 text-primary-fixed'
                        : 'border-outline-variant/20 text-secondary hover:border-outline-variant/60'
                    }`}
                  >
                    <span className="font-headline text-xl font-bold">{opt.label}</span>
                    <span className="font-label text-[8px] tracking-widest mt-1 opacity-60">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Account */}
          <section className="bg-surface-container-low border border-outline-variant/10">
            <div className="px-4 h-11 flex items-center bg-surface-container border-b border-outline-variant/10">
              <span className="font-label text-[9px] uppercase tracking-widest text-primary-fixed">ACCOUNT</span>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-label text-[9px] uppercase tracking-widest text-secondary/50">OPERATOR</span>
                  <span className="font-headline text-lg font-bold text-on-surface">{username}</span>
                </div>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="font-label text-[9px] uppercase tracking-widest text-secondary/50 hover:text-primary-fixed transition-colors"
                >
                  VIEW STATS →
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 h-10 w-full border border-outline-variant/20 font-label text-[9px] uppercase tracking-widest text-secondary hover:border-red-500/40 hover:text-red-400 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                DISCONNECT_OPERATOR
              </button>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
