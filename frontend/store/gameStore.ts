import { create } from 'zustand';
import { initGameState, applyMoveLogic } from '@/lib/gameLogic';
import type { LocalGameState, Move } from '@/types/game';

interface GameStore {
  gameState: LocalGameState | null;
  startGame: () => void;
  makeMove: (move: Move) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  startGame: () => set({ gameState: initGameState() }),
  makeMove: (move) =>
    set((s) => {
      if (!s.gameState || s.gameState.status !== 'active') return s;
      return { gameState: applyMoveLogic(s.gameState, move) };
    }),
  resetGame: () => set({ gameState: null }),
}));
