'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { connectSocket, getSocket } from '@/lib/socket';
import { useGameStore, getOrCreatePlayerToken } from '@/store/gameStore';
import GameBoard from '@/components/game/GameBoard';
import type { GameStateEvent, Move } from '@/types/game';

export default function MultiplayerGamePage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;

  const applyServerState = useGameStore(s => s.applyServerState);
  const setOpponentDisconnected = useGameStore(s => s.setOpponentDisconnected);
  const gameState = useGameStore(s => s.gameState);
  const playerRole = useGameStore(s => s.playerRole);
  const opponentDisconnected = useGameStore(s => s.opponentDisconnected);

  const [opponentName, setOpponentName] = useState<string>('');
  const [log, setLog] = useState<string[]>(['[SYSTEM] CONNECTION ESTABLISHED.']);
  const logRef = useRef<HTMLDivElement>(null);

  const myName = typeof window !== 'undefined'
    ? sessionStorage.getItem('operatorName') ?? 'OP_01'
    : 'OP_01';

  useEffect(() => {
    const token = getOrCreatePlayerToken();
    const name = sessionStorage.getItem('operatorName') ?? 'OPERATOR';
    const socket = connectSocket();

    socket.emit('room:join', { roomId, playerToken: token, playerName: name });

    function onGameState(data: GameStateEvent) {
      applyServerState(data.gameState);
      const opp = data.room.players.find(p => p.playerToken !== token);
      if (opp) setOpponentName(opp.name);

      const now = new Date().toLocaleTimeString('en-US', { hour12: false });
      const turn = data.gameState.currentTurn === 'p1' ? 'OP_01' : 'OP_02';
      setLog(prev => [...prev.slice(-20), `[${now}] TURN: ${turn}`]);
    }

    function onOpponentDisconnected() {
      setOpponentDisconnected(true);
      setLog(prev => [...prev, '[WARN] OPPONENT_DISCONNECTED.']);
    }

    socket.on('game:state', onGameState);
    socket.on('opponent:disconnected', onOpponentDisconnected);

    return () => {
      socket.off('game:state', onGameState);
      socket.off('opponent:disconnected', onOpponentDisconnected);
      socket.emit('room:leave', { roomId, playerToken: token });
    };
  }, [roomId, applyServerState, setOpponentDisconnected]);

  // Scroll log to bottom
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  function handleLineClick(move: Move) {
    const token = getOrCreatePlayerToken();
    getSocket().emit('room:move', { roomId, playerToken: token, move });
  }

  const isMyTurn = gameState?.currentTurn === playerRole;
  const p1Score = gameState?.scores.p1 ?? 0;
  const p2Score = gameState?.scores.p2 ?? 0;
  const isFinished = gameState?.status === 'finished';

  return (
    <div className="min-h-screen bg-background text-primary font-body overflow-hidden">
      {/* TopNav */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-surface/80 backdrop-blur-xl border-b border-surface-variant/20">
        <div className="font-headline text-lg font-bold tracking-tighter uppercase">KINETIC_GRID</div>
        <div className="hidden md:flex items-center gap-8">
          <span className="font-label text-[10px] tracking-widest text-secondary">
            ROOM: <span className="text-primary-fixed">{roomId}</span>
          </span>
          <span className="font-label text-[10px] tracking-widest text-secondary">
            OPERATOR: <span className="text-primary">{myName}</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-secondary hover:text-primary-fixed cursor-pointer transition-colors">help</span>
        </div>
      </header>

      {/* SideNav */}
      <aside className="fixed left-0 top-0 h-full hidden lg:flex flex-col items-center py-20 z-40 bg-surface w-20 border-r border-surface-variant/20">
        <div className="mb-12 flex flex-col items-center">
          <div className="font-headline text-white font-black text-xs tracking-tighter">
            {playerRole?.toUpperCase() ?? 'OP'}
          </div>
          <div className="text-primary-fixed text-[8px] font-bold tracking-[0.2em]">
            {isMyTurn ? 'YOUR_TURN' : 'WAITING'}
          </div>
        </div>
        <div className="flex flex-col gap-10">
          {[
            { icon: 'grid_4x4', label: 'GRID', active: true },
            { icon: 'leaderboard', label: 'LB', active: false },
          ].map(({ icon, label, active }) => (
            <div
              key={icon}
              className={`flex flex-col items-center gap-2 cursor-pointer transition-all duration-100 ${
                active
                  ? 'text-primary-fixed border-r-2 border-primary-fixed pr-2'
                  : 'text-surface-container-highest hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span className="font-label text-[9px] tracking-widest uppercase">{label}</span>
            </div>
          ))}
        </div>
      </aside>

      <main className="relative h-screen flex items-center justify-center pt-16 lg:pl-20">
        {/* Left Telemetry Panel */}
        <section className="hidden xl:flex fixed left-24 top-20 bottom-20 w-56 z-30 flex-col">
          <div className="bg-surface/10 backdrop-blur-xl border-l border-t border-outline-variant/20 p-4 h-full flex flex-col">
            <header className="flex justify-between items-center mb-4">
              <h2 className="font-headline text-[10px] tracking-[0.3em] uppercase text-secondary">Telemetry_Feed</h2>
              <span className="w-2 h-2 bg-primary-fixed block" />
            </header>
            <div
              ref={logRef}
              className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] leading-relaxed text-secondary/60"
            >
              {log.map((entry, i) => (
                <div key={i} className={entry.includes('[SYSTEM]') || entry.includes('[WARN]') ? 'text-primary-fixed' : ''}>
                  {entry}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-outline-variant/20">
              <div className="flex items-center gap-2 text-[10px] font-headline tracking-widest text-outline">
                <span className="animate-pulse">_</span> LIVE_FEED
              </div>
            </div>
          </div>
        </section>

        {/* Board area */}
        <div className="flex flex-col items-center gap-6">
          {/* Score bar */}
          <div className="flex items-center gap-8 font-headline">
            <div className="text-center">
              <div className="text-[10px] tracking-widest text-secondary">{myName}</div>
              <div className={`text-3xl font-bold ${playerRole === 'p1' ? 'text-primary' : 'text-primary-fixed'}`}>
                {playerRole === 'p1' ? p1Score : p2Score}
              </div>
            </div>
            <div className="text-secondary/30 font-body text-lg">—</div>
            <div className="text-center">
              <div className="text-[10px] tracking-widest text-secondary">{opponentName || 'OPPONENT'}</div>
              <div className={`text-3xl font-bold ${playerRole === 'p1' ? 'text-primary-fixed' : 'text-primary'}`}>
                {playerRole === 'p1' ? p2Score : p1Score}
              </div>
            </div>
          </div>

          {/* Turn indicator */}
          <div className="font-label text-[10px] tracking-widest uppercase">
            {isFinished ? (
              <span className="text-primary-fixed">GAME_COMPLETE</span>
            ) : isMyTurn ? (
              <span className="text-primary-fixed animate-pulse">YOUR_TURN ▸</span>
            ) : (
              <span className="text-secondary/60">OPPONENT_CALCULATING...</span>
            )}
          </div>

          {/* Game board */}
          {gameState && (
            <GameBoard
              gameState={gameState}
              onLineClick={handleLineClick}
              isMyTurn={isMyTurn && !isFinished}
            />
          )}

          {!gameState && (
            <div className="font-label text-[10px] tracking-widest text-secondary/40 animate-pulse">
              ESTABLISHING_GRID_CONNECTION...
            </div>
          )}
        </div>

        {/* Opponent disconnected overlay */}
        {opponentDisconnected && (
          <div className="fixed inset-0 bg-background/90 backdrop-blur-xl z-50 flex items-center justify-center">
            <div className="text-center space-y-6">
              <h2 className="font-headline text-2xl tracking-tighter">OPPONENT_DISCONNECTED</h2>
              <p className="font-label text-[10px] tracking-widest text-secondary/60">GRID SESSION TERMINATED</p>
              <button
                onClick={() => router.push('/lobby')}
                className="px-8 py-4 bg-primary-fixed text-on-primary-fixed font-headline font-bold tracking-widest hover:shadow-[0_0_20px_rgba(204,255,0,0.2)] transition-all"
              >
                RETURN_TO_LOBBY
              </button>
            </div>
          </div>
        )}

        {/* Game end overlay */}
        {isFinished && !opponentDisconnected && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-50 flex items-center justify-center">
            <div className="relative bg-surface-container border border-outline-variant/20 p-12 max-w-md w-full text-center space-y-8">
              <div className="absolute top-0 left-0 w-8 h-px bg-primary-fixed" />
              <div className="absolute top-0 left-0 w-px h-8 bg-primary-fixed" />
              <h2 className="font-headline text-3xl font-bold tracking-tighter">
                {gameState.winner === null
                  ? 'DRAW_DETECTED'
                  : gameState.winner === playerRole
                    ? 'VICTORY_CONFIRMED'
                    : 'DEFEAT_LOGGED'}
              </h2>
              <div className="font-label text-[10px] tracking-widest text-secondary/60">
                FINAL_SCORE: {p1Score} — {p2Score}
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/lobby')}
                  className="px-8 py-4 bg-primary-fixed text-on-primary-fixed font-headline font-bold tracking-widest hover:shadow-[0_0_20px_rgba(204,255,0,0.2)] transition-all"
                >
                  PLAY_AGAIN
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-8 py-4 border border-outline-variant/40 text-secondary font-headline font-bold tracking-widest hover:text-primary transition-colors"
                >
                  EXIT_GRID
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
