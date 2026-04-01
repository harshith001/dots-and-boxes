'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { connectSocket } from '@/lib/socket';
import { useGameStore, getOrCreatePlayerToken } from '@/store/gameStore';

const GRID_OPTIONS = [
  { value: 5, label: '5×5', sub: 'TACTICAL' },
  { value: 9, label: '9×9', sub: 'STANDARD' },
  { value: 13, label: '13×13', sub: 'GRID WAR' },
];

export default function LobbyPage() {
  const router = useRouter();
  const setRoomId = useGameStore(s => s.setRoomId);
  const setPlayerRole = useGameStore(s => s.setPlayerRole);
  const setConnectionStatus = useGameStore(s => s.setConnectionStatus);
  const [operatorName, setOperatorNameLocal] = useState('OPERATOR');
  const [status, setStatus] = useState<'idle' | 'searching'>('idle');
  const [gridSize, setGridSizeState] = useState(5);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const name = sessionStorage.getItem('operatorName');
    if (!name) { router.replace('/'); return; }
    setOperatorNameLocal(name);
    setGridSizeState(parseInt(sessionStorage.getItem('gridSize') ?? '5'));
  }, [router]);

  function handleGridSize(size: number) {
    sessionStorage.setItem('gridSize', String(size));
    setGridSizeState(size);
  }

  function startCountdown() {
    setCountdown(5);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleQuickMatch() {
    setStatus('searching');
    startCountdown();
    const token = getOrCreatePlayerToken();
    const name = sessionStorage.getItem('operatorName') ?? 'OPERATOR';
    const size = parseInt(sessionStorage.getItem('gridSize') ?? '5');
    const socket = connectSocket();
    setConnectionStatus('connecting');

    socket.emit('queue:join', { playerToken: token, playerName: name, gridSize: size });

    socket.once('queue:matched', ({ roomId, playerRole }: { roomId: string; playerRole: 'p1' | 'p2' }) => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setRoomId(roomId);
      setPlayerRole(playerRole);
      setConnectionStatus('connected');
      router.push(`/game/${roomId}`);
    });
  }

  function handleCreateSession() {
    const token = getOrCreatePlayerToken();
    const name = sessionStorage.getItem('operatorName') ?? 'OPERATOR';
    const size = parseInt(sessionStorage.getItem('gridSize') ?? '5');
    const socket = connectSocket();
    setConnectionStatus('connecting');

    socket.emit('room:create', { playerToken: token, playerName: name, gridSize: size });

    socket.once('room:created', ({ roomId, playerRole }: { roomId: string; playerRole: 'p1' | 'p2' }) => {
      setRoomId(roomId);
      setPlayerRole(playerRole);
      setConnectionStatus('connected');
      router.push(`/room/${roomId}`);
    });
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body overflow-hidden">
      <header className="fixed top-0 w-full z-50 flex items-center px-6 h-14 bg-surface-container-lowest border-b border-outline-variant/10">
        <span className="font-headline font-bold tracking-tighter text-on-surface text-lg flex-1">KINETIC_GRID</span>
        <span className="font-label text-[10px] uppercase tracking-widest text-secondary/60">
          OPERATOR: <span className="text-primary-fixed">{operatorName}</span>
        </span>
      </header>

      <main className="relative h-screen flex flex-col items-center justify-center pt-14 px-6">
        <div className="absolute inset-0 dot-grid opacity-[0.03] pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm flex flex-col gap-5">

          <div>
            <h1 className="font-headline text-2xl font-bold tracking-tighter mb-1">SELECT_PROTOCOL</h1>
            <p className="font-label text-[9px] uppercase tracking-widest text-secondary/50">
              OPERATOR {operatorName}
            </p>
          </div>

          {/* Grid size selector */}
          <div className="flex flex-col gap-2">
            <span className="font-label text-[9px] uppercase tracking-widest text-secondary/50">GRID_SCALE</span>
            <div className="grid grid-cols-3 gap-2">
              {GRID_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleGridSize(opt.value)}
                  disabled={status === 'searching'}
                  className={`flex flex-col items-center py-3 border transition-colors disabled:opacity-40 ${
                    gridSize === opt.value
                      ? 'border-primary-fixed bg-primary-fixed/5 text-primary-fixed'
                      : 'border-outline-variant/20 text-secondary hover:border-outline-variant/50'
                  }`}
                >
                  <span className="font-headline text-sm font-bold">{opt.label}</span>
                  <span className="font-label text-[7px] tracking-widest mt-0.5 opacity-60">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Match options */}
          <div className="flex flex-col gap-3">
            {/* Quick Match */}
            <button
              onClick={handleQuickMatch}
              disabled={status === 'searching'}
              className="relative flex flex-col items-start p-6 border border-outline-variant/20 bg-surface-container-low hover:border-primary-fixed/50 transition-all disabled:opacity-70"
            >
              <div className="flex items-center gap-3 mb-2 w-full">
                <span className="material-symbols-outlined text-primary-fixed">bolt</span>
                <span className="font-headline text-lg font-bold tracking-tight flex-1">QUICK_MATCH</span>
                {status === 'searching' && countdown !== null && (
                  <span className="font-headline text-lg font-black text-primary-fixed tabular-nums">
                    {countdown}s
                  </span>
                )}
                {status === 'searching' && countdown === null && (
                  <span className="w-1.5 h-1.5 bg-primary-fixed animate-ping" />
                )}
              </div>
              <p className="font-label text-[9px] uppercase tracking-widest text-secondary/50">
                {status === 'searching'
                  ? countdown !== null
                    ? `SEARCHING — BOT FALLBACK IN ${countdown}s`
                    : 'CONNECTING TO OPPONENT...'
                  : 'AUTO-PAIR WITH AVAILABLE OPERATOR — BOT FALLBACK IN 5S'}
              </p>
            </button>

            {/* Private Session */}
            <button
              onClick={handleCreateSession}
              disabled={status === 'searching'}
              className="flex flex-col items-start p-6 border border-outline-variant/20 bg-surface-container-low hover:border-outline-variant/50 transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-secondary">link</span>
                <span className="font-headline text-lg font-bold tracking-tight">CREATE_SESSION</span>
              </div>
              <p className="font-label text-[9px] uppercase tracking-widest text-secondary/50">
                GENERATE INVITE LINK — SHARE WITH SPECIFIC OPERATOR
              </p>
            </button>
          </div>

          <div className="flex justify-between items-center pt-1">
            <button
              onClick={() => router.push('/')}
              className="font-label text-[9px] uppercase tracking-widest text-secondary/40 hover:text-on-surface transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              CHANGE_OPERATOR
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="font-label text-[9px] uppercase tracking-widest text-secondary/40 hover:text-primary-fixed transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">settings</span>
              SETTINGS
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
