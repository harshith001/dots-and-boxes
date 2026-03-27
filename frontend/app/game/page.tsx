'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { GameBoard } from '@/components/game/GameBoard';
import { PlayerCard } from '@/components/game/PlayerCard';
import { TurnLabel } from '@/components/game/TurnLabel';

export default function GamePage() {
  const { gameState, startGame, makeMove, resetGame } = useGameStore();

  useEffect(() => {
    if (!gameState) startGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07090f' }}>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: '#38bdf8', animationDelay: `${i * 0.2}s`, opacity: 0.6 }}
            />
          ))}
        </div>
      </div>
    );
  }

  const isFinished = gameState.status === 'finished';
  const winnerText =
    gameState.winner === 'p1' ? 'Player 1 wins!'
    : gameState.winner === 'p2' ? 'Player 2 wins!'
    : "It's a draw!";
  const winnerColor =
    gameState.winner === 'p1' ? '#38bdf8'
    : gameState.winner === 'p2' ? '#f472b6'
    : '#94a3b8';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #0f1e3a 0%, #07090f 50%)' }}
    >
      {/* Background dot grid */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top nav */}
      <header
        className="relative z-10 flex items-center justify-between px-8 py-4"
        style={{ borderBottom: '1px solid #0f1829' }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase transition-colors duration-200"
          style={{ color: '#334155' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#64748b'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#334155'; }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Home
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#38bdf8' }} />
          <span className="text-xs font-black tracking-widest uppercase" style={{ color: '#e2e8f0' }}>
            Dots &amp; Boxes
          </span>
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#f472b6' }} />
        </div>

        {/* Score summary */}
        <div className="flex items-center gap-3 text-xs font-bold tabular-nums">
          <span style={{ color: '#38bdf8' }}>{gameState.scores.p1}</span>
          <span style={{ color: '#1e2a3a' }}>—</span>
          <span style={{ color: '#f472b6' }}>{gameState.scores.p2}</span>
        </div>
      </header>

      {/* Game area */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
        <div className="grid grid-cols-[220px_1fr_220px] gap-8 items-center w-full max-w-[940px]">

          {/* P1 card */}
          <PlayerCard
            role="p1"
            name="Player 1"
            score={gameState.scores.p1}
            isActive={!isFinished && gameState.currentTurn === 'p1'}
            isMe={true}
          />

          {/* Board column */}
          <div className="flex flex-col items-center gap-5">

            {/* Turn / winner indicator */}
            {isFinished ? (
              <div
                key="winner"
                className="animate-winner-pop flex flex-col items-center gap-3 px-8 py-5 rounded-2xl"
                style={{
                  background: `linear-gradient(145deg, ${winnerColor}15, #0d1117)`,
                  border: `1px solid ${winnerColor}40`,
                  boxShadow: `0 0 40px ${winnerColor}20`,
                }}
              >
                <div className="text-lg font-black tracking-tight" style={{ color: winnerColor }}>
                  {winnerText}
                </div>
                <div className="text-xs" style={{ color: '#334155' }}>
                  {gameState.scores.p1} — {gameState.scores.p2}
                </div>
              </div>
            ) : (
              <TurnLabel currentTurn={gameState.currentTurn} />
            )}

            <GameBoard
              gameState={gameState}
              onMove={makeMove}
              disabled={isFinished}
            />

            {/* Play again */}
            {isFinished && (
              <button
                onClick={resetGame}
                className="px-8 py-3 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                  color: '#07090f',
                  boxShadow: '0 0 24px rgba(56,189,248,0.3)',
                }}
              >
                Play Again
              </button>
            )}

          </div>

          {/* P2 card */}
          <PlayerCard
            role="p2"
            name="Player 2"
            score={gameState.scores.p2}
            isActive={!isFinished && gameState.currentTurn === 'p2'}
            isMe={false}
          />

        </div>
      </div>
    </div>
  );
}
