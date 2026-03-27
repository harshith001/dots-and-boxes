'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, postSession } from '../lib/api';

const GRID_OPTIONS = [
  { dots: 5, label: '5×5', mode: 'TACTICAL_FAST' },
  { dots: 9, label: '9×9', mode: 'STANDARD_ENGAGE' },
  { dots: 13, label: '13×13', mode: 'GRID_WAR' },
] as const;

export default function SetupScreen() {
  const [name, setName] = useState('');
  const [gridSize, setGridSize] = useState(5);
  const router = useRouter();

  useEffect(() => {
    getSession().then(session => {
      if (session?.operatorName) {
        setName(session.operatorName);
      }
    });
  }, []);

  async function handleDeploy() {
    if (!name.trim()) return;
    const operatorName = name.trim().toUpperCase().slice(0, 24);
    await postSession(operatorName).catch(() => null);
    sessionStorage.setItem('operatorName', operatorName);
    sessionStorage.setItem('gridSize', String(gridSize));
    router.push('/lobby');
  }

  return (
    <div className="min-h-screen bg-background text-primary font-body overflow-hidden selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-14 bg-surface border-b border-surface-variant/20">
        <div className="flex items-center gap-4">
          <span className="font-headline font-bold tracking-tighter text-primary text-lg">
            MONOCHROME_KINETIC_V1.0
          </span>
          <div className="h-4 w-px bg-outline-variant opacity-20" />
          <span className="font-label uppercase tracking-tight text-xs text-secondary">
            SYSTEM_STATUS: <span className="text-primary-fixed">OPERATIONAL</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="material-symbols-outlined text-sm text-secondary cursor-pointer hover:text-primary transition-colors">
            settings
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="relative h-screen w-full flex items-center justify-center pt-14">
        {/* Dot grid background */}
        <div className="absolute inset-0 dot-grid opacity-[0.03] pointer-events-none" />

        {/* Panel */}
        <div className="relative w-full max-w-xl z-10 px-8">
          {/* Terminal header decoration */}
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 bg-primary opacity-20" />
              <div className="w-1.5 h-1.5 bg-primary opacity-20" />
              <div className="w-1.5 h-1.5 bg-primary opacity-20" />
            </div>
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary opacity-50">
              AUTH_SEQUENCE_PENDING
            </span>
          </div>

          {/* Main panel */}
          <div className="bg-surface-container-high/40 backdrop-blur-xl border border-outline-variant/10 p-10 shadow-2xl">
            <div className="mb-12">
              <h1 className="font-headline text-3xl font-bold text-primary tracking-tighter mb-2">
                INITIALIZE_OPERATOR
              </h1>
              <p className="font-label text-[10px] uppercase tracking-widest text-secondary/60">
                ESTABLISHING ENCRYPTED CONNECTION TO GRID_SERVER_01
              </p>
            </div>

            <div className="space-y-12">
              {/* Name input */}
              <div className="space-y-3">
                <label className="font-label text-[10px] uppercase tracking-widest text-primary-fixed block">
                  INITIALIZING_OPERATOR_NAME
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="ENTER_ID"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleDeploy()}
                    maxLength={24}
                    className="w-full bg-transparent border-0 border-b border-outline-variant/30 py-4 font-headline text-xl text-primary placeholder:text-surface-variant focus:ring-0 focus:outline-none transition-colors duration-200 focus:border-primary-fixed"
                  />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary-fixed animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Grid size selector */}
              <div className="space-y-3">
                <label className="font-label text-[10px] uppercase tracking-widest text-primary-fixed block">
                  GRID_DIMENSIONS
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GRID_OPTIONS.map(({ dots, label, mode }) => {
                    const active = gridSize === dots;
                    return (
                      <button
                        key={dots}
                        type="button"
                        onClick={() => setGridSize(dots)}
                        className={`flex flex-col items-start p-3 border transition-all duration-150 ${
                          active
                            ? 'border-primary-fixed bg-primary-fixed/5 text-primary-fixed'
                            : 'border-outline-variant/10 text-secondary hover:border-primary-fixed/50'
                        }`}
                      >
                        <span className="font-headline text-sm font-bold tracking-tight">{label}</span>
                        <span className="font-label text-[9px] uppercase tracking-widest opacity-60 mt-0.5">{mode}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CTA */}
              <div className="pt-6 space-y-4">
                <button
                  onClick={handleDeploy}
                  disabled={!name.trim()}
                  className="w-full h-16 bg-primary-fixed text-on-primary-fixed font-headline font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-[0_0_20px_rgba(204,255,0,0.2)] transition-all duration-300 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  DEPLOY_INITIAL_SEQUENCE
                  <span className="material-symbols-outlined">double_arrow</span>
                </button>
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary-fixed animate-ping" />
                    <span className="font-label text-[10px] text-secondary/60">SYNCING_ASSETS</span>
                  </div>
                  <span className="font-label text-[10px] text-secondary/40 uppercase">VER_2.0.0_STABLE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex justify-between items-start opacity-30">
            <p className="font-label text-[9px] leading-tight uppercase tracking-tighter max-w-[200px]">
              WARNING: ALL ACTIONS ARE LOGGED BY CENTRAL_VOID.
            </p>
            <div className="text-right">
              <p className="font-label text-[9px] uppercase tracking-tighter">KINETIC_GRID // TACTICAL DIVISION</p>
              <p className="font-label text-[9px] text-secondary/60">© 2026 GRID_OPS</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
