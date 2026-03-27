'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { connectSocket } from '@/lib/socket';
import { useGameStore, getOrCreatePlayerToken } from '@/store/gameStore';
import type { GameStateEvent } from '@/types/game';

export default function InviteScreen() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const [copied, setCopied] = useState(false);
  const setRoomId = useGameStore(s => s.setRoomId);
  const setPlayerRole = useGameStore(s => s.setPlayerRole);

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${roomId}`
    : '';

  useEffect(() => {
    const name = sessionStorage.getItem('operatorName');
    if (!name) {
      router.replace(`/?redirect=/room/${roomId}`);
      return;
    }
    const token = getOrCreatePlayerToken();
    const socket = connectSocket();
    setRoomId(roomId);

    // Always emit room:join — backend handles reconnect for creator, join for invitee
    socket.emit('room:join', { roomId, playerToken: token, playerName: name });

    function onGameState(data: GameStateEvent) {
      // Once two players are in the room, navigate to game
      if (data.room.players.length === 2 && data.room.status === 'active') {
        const player = data.room.players.find(p => p.playerToken === token);
        if (player) setPlayerRole(player.role);
        router.push(`/game/${roomId}`);
      }
    }

    socket.on('game:state', onGameState);
    return () => { socket.off('game:state', onGameState); };
  }, [roomId, router, setRoomId, setPlayerRole]);

  function handleCopy() {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background text-primary font-body overflow-hidden selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-14 bg-surface border-b border-surface-variant/20">
        <span className="font-headline font-bold tracking-tighter text-primary text-lg">
          MONOCHROME_KINETIC_V1.0
        </span>
        <div className="flex items-center gap-6">
          <span className="material-symbols-outlined text-sm text-secondary cursor-pointer hover:text-primary-fixed transition-colors">settings</span>
        </div>
      </header>

      {/* Side nav stub */}
      <nav className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] hidden lg:flex flex-col items-center py-8 z-40 bg-surface/90 w-20 border-r border-surface-variant/20">
        <div className="flex flex-col gap-10">
          {['grid_4x4', 'leaderboard'].map(icon => (
            <div key={icon} className="flex flex-col items-center gap-1 cursor-pointer text-secondary/40 hover:text-secondary p-2">
              <span className="material-symbols-outlined">{icon}</span>
            </div>
          ))}
        </div>
      </nav>

      <main className="relative h-screen w-full flex items-center justify-center pt-14 lg:pl-20">
        <div className="absolute inset-0 dot-grid opacity-[0.03] pointer-events-none" />

        {/* Asymmetric decorative lines */}
        <div className="absolute top-1/4 right-10 w-px h-64 bg-primary/10" />
        <div className="absolute top-1/4 right-6 w-px h-32 bg-primary/5" />

        <div className="relative z-10 w-full max-w-xl mx-4">
          {/* Panel with kinetic-glow */}
          <div className="bg-surface-container-low/80 backdrop-blur-2xl border border-outline-variant/20 p-8 md:p-12 relative overflow-hidden kinetic-glow">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-8 h-px bg-primary-fixed" />
            <div className="absolute top-0 left-0 w-px h-8 bg-primary-fixed" />

            {/* Header */}
            <div className="mb-12">
              <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tighter text-primary mb-2">
                GENERATE_SESSION_KEY
              </h2>
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-outline-variant/30" />
                <span className="font-label text-[10px] tracking-[0.2em] text-secondary">PROTOCOL_ALPHA_09</span>
              </div>
            </div>

            {/* URL input */}
            <div className="space-y-10">
              <div className="relative group">
                <label className="font-label text-[10px] tracking-widest text-secondary mb-3 block opacity-60">
                  SESSION_URL
                </label>
                <div className="flex items-center border-b border-outline-variant transition-colors duration-200 focus-within:border-primary-fixed">
                  <input
                    className="bg-transparent border-none w-full py-4 px-0 font-headline text-lg text-primary-fixed-dim tracking-tight focus:ring-0 focus:outline-none"
                    readOnly
                    value={inviteUrl}
                  />
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-background font-label text-[10px] font-bold tracking-widest hover:bg-primary-fixed transition-colors duration-100 whitespace-nowrap"
                  >
                    {copied ? 'COPIED!' : 'COPY_TO_CLIPBOARD'}
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between py-4 px-5 bg-surface-container-lowest border border-surface-variant/10">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-fixed opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-fixed" />
                  </div>
                  <span className="font-label text-[11px] tracking-widest text-primary-fixed">
                    AWAITING_OPPONENT...
                  </span>
                </div>
                <span className="font-label text-[10px] text-secondary opacity-40">LATENCY: --ms</span>
              </div>
            </div>

            {/* Footer metadata */}
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 pt-8 border-t border-surface-variant/10">
              {[
                { label: 'GRID_SCALE', value: '5×5_TACTICAL' },
                { label: 'SECURITY', value: 'END_TO_END' },
                { label: 'REGION', value: 'LOCAL_HOST' },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col">
                  <span className="font-label text-[9px] text-secondary/40 tracking-widest">{label}</span>
                  <span className="font-headline text-xs font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Back link */}
          <div className="mt-6 flex justify-between items-center px-4">
            <button
              onClick={() => router.push('/lobby')}
              className="flex items-center gap-2 font-label text-[10px] tracking-widest text-secondary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              CANCEL_AND_RETURN
            </button>
            <div className="flex gap-4">
              <div className="w-1 h-1 bg-primary-fixed" />
              <div className="w-1 h-1 bg-outline-variant" />
              <div className="w-1 h-1 bg-outline-variant" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
