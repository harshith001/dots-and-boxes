'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { connectSocket } from '@/lib/socket';
import { useGameStore, getOrCreatePlayerToken } from '@/store/gameStore';

export default function LobbyPage() {
  const router = useRouter();
  const setRoomId = useGameStore(s => s.setRoomId);
  const setPlayerRole = useGameStore(s => s.setPlayerRole);
  const setConnectionStatus = useGameStore(s => s.setConnectionStatus);
  const [operatorName, setOperatorNameLocal] = useState('OPERATOR');
  const [status, setStatus] = useState<'idle' | 'searching'>('idle');

  useEffect(() => {
    const name = sessionStorage.getItem('operatorName') ?? 'OPERATOR';
    setOperatorNameLocal(name);
  }, []);

  function handleQuickMatch() {
    setStatus('searching');
    const token = getOrCreatePlayerToken();
    const name = sessionStorage.getItem('operatorName') ?? 'OPERATOR';
    const gridSize = parseInt(sessionStorage.getItem('gridSize') ?? '5');
    const socket = connectSocket();
    setConnectionStatus('connecting');

    socket.emit('queue:join', { playerToken: token, playerName: name, gridSize });

    socket.once('queue:matched', ({ roomId, playerRole }: { roomId: string; playerRole: 'p1' | 'p2' }) => {
      setRoomId(roomId);
      setPlayerRole(playerRole);
      setConnectionStatus('connected');
      router.push(`/game/${roomId}`);
    });
  }

  function handleCreateSession() {
    const token = getOrCreatePlayerToken();
    const name = sessionStorage.getItem('operatorName') ?? 'OPERATOR';
    const gridSize = parseInt(sessionStorage.getItem('gridSize') ?? '5');
    const socket = connectSocket();
    setConnectionStatus('connecting');

    socket.emit('room:create', { playerToken: token, playerName: name, gridSize });

    socket.once('room:created', ({ roomId, playerRole }: { roomId: string; playerRole: 'p1' | 'p2' }) => {
      setRoomId(roomId);
      setPlayerRole(playerRole);
      setConnectionStatus('connected');
      router.push(`/room/${roomId}`);
    });
  }

  return (
    <div className="min-h-screen bg-background text-primary font-body overflow-hidden">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-14 bg-surface border-b border-surface-variant/20">
        <span className="font-headline font-bold tracking-tighter text-primary text-lg">
          MONOCHROME_KINETIC_V1.0
        </span>
        <span className="font-label text-[10px] uppercase tracking-widest text-secondary">
          OPERATOR: <span className="text-primary-fixed">{operatorName}</span>
        </span>
      </header>

      <main className="relative h-screen flex items-center justify-center pt-14">
        <div className="absolute inset-0 dot-grid opacity-[0.03] pointer-events-none" />

        <div className="relative z-10 w-full max-w-xl px-8">
          <div className="mb-10">
            <h1 className="font-headline text-3xl font-bold tracking-tighter mb-2">SELECT_PROTOCOL</h1>
            <p className="font-label text-[10px] uppercase tracking-widest text-secondary/60">
              CHOOSE ENGAGEMENT MODE — OPERATOR {operatorName}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Quick Match */}
            <button
              onClick={handleQuickMatch}
              disabled={status === 'searching'}
              className="group relative flex flex-col items-start p-8 border border-outline-variant/20 bg-surface-container-high/40 hover:border-primary-fixed/50 hover:bg-surface-container/60 transition-all duration-200 disabled:opacity-50"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-primary-fixed">bolt</span>
                <span className="font-headline text-xl font-bold tracking-tight">QUICK_MATCH</span>
              </div>
              <p className="font-label text-[10px] uppercase tracking-widest text-secondary/60">
                {status === 'searching' ? 'SEARCHING FOR OPPONENT...' : 'AUTO-PAIR WITH AVAILABLE OPERATOR — BOT FALLBACK IN 5S'}
              </p>
              {status === 'searching' && (
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary-fixed animate-ping" />
                </div>
              )}
            </button>

            {/* Private Session */}
            <button
              onClick={handleCreateSession}
              disabled={status === 'searching'}
              className="group flex flex-col items-start p-8 border border-outline-variant/20 bg-surface-container-high/40 hover:border-primary/50 hover:bg-surface-container/60 transition-all duration-200 disabled:opacity-50"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-secondary">link</span>
                <span className="font-headline text-xl font-bold tracking-tight">CREATE_SESSION</span>
              </div>
              <p className="font-label text-[10px] uppercase tracking-widest text-secondary/60">
                GENERATE INVITE LINK — SHARE WITH SPECIFIC OPERATOR
              </p>
            </button>
          </div>

          <div className="mt-8 flex justify-between items-center">
            <button
              onClick={() => router.push('/')}
              className="font-label text-[10px] tracking-widest text-secondary/60 hover:text-primary transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              CHANGE_OPERATOR
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
