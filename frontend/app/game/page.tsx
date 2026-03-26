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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-base text-slate-500">Loading…</p>
      </div>
    );
  }

  const winnerText =
    gameState.winner === 'p1'
      ? 'Player 1 wins!'
      : gameState.winner === 'p2'
      ? 'Player 2 wins!'
      : "It's a draw!";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid grid-cols-[240px_1fr_240px] gap-8 items-start px-8 py-12 max-w-[960px] mx-auto">
        {/* Left column — Player 1 */}
        <PlayerCard
          player="p1"
          name="Player 1"
          score={gameState.scores.p1}
          isActive={gameState.currentTurn === 'p1'}
        />

        {/* Center column — board */}
        <div className="flex flex-col items-center gap-4">
          {gameState.status === 'active' && (
            <TurnLabel currentTurn={gameState.currentTurn} />
          )}

          {gameState.status === 'finished' && (
            <p className="text-base font-semibold text-slate-800">{winnerText}</p>
          )}

          <GameBoard
            gameState={gameState}
            onMove={makeMove}
            disabled={gameState.status !== 'active'}
          />

          {gameState.status === 'finished' && (
            <button
              onClick={resetGame}
              className="bg-slate-800 text-white text-base font-semibold rounded-lg px-6 py-4 hover:bg-slate-700 transition-colors"
            >
              Play Again
            </button>
          )}

          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {/* Right column — Player 2 */}
        <PlayerCard
          player="p2"
          name="Player 2"
          score={gameState.scores.p2}
          isActive={gameState.currentTurn === 'p2'}
        />
      </div>
    </div>
  );
}
