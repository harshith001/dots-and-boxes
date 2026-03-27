import { create } from 'zustand';
import { initGameState, applyMoveLogic } from '@/lib/gameLogic';
import type { LocalGameState, Move } from '@/types/game';

// --- Multiplayer helpers ---

export function getOrCreatePlayerToken(): string {
  let token = sessionStorage.getItem('playerToken');
  if (!token) {
    token = crypto.randomUUID();
    sessionStorage.setItem('playerToken', token);
  }
  return token;
}

// --- Store interfaces ---

interface MultiplayerState {
  roomId: string | null;
  playerRole: 'p1' | 'p2' | null;
  playerToken: string | null;
  opponentName: string | null;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'disconnected';
  opponentDisconnected: boolean;
}

interface GameStore extends MultiplayerState {
  gameState: LocalGameState | null;
  gridSize: number;
  // Local game actions
  startGame: (gridSize?: number) => void;
  makeMove: (move: Move) => void;
  resetGame: () => void;
  setGridSize: (gridSize: number) => void;
  // Multiplayer actions
  setRoomId: (roomId: string | null) => void;
  setPlayerRole: (role: 'p1' | 'p2' | null) => void;
  setPlayerToken: (token: string | null) => void;
  setOpponentName: (name: string | null) => void;
  setConnectionStatus: (status: MultiplayerState['connectionStatus']) => void;
  setOpponentDisconnected: (v: boolean) => void;
  applyServerState: (gameState: LocalGameState) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Local game state
  gameState: null,
  gridSize: 5,
  startGame: (gridSize) =>
    set((s) => ({ gameState: initGameState(gridSize ?? s.gridSize) })),
  makeMove: (move) =>
    set((s) => {
      if (!s.gameState || s.gameState.status !== 'active') return s;
      return { gameState: applyMoveLogic(s.gameState, move) };
    }),
  resetGame: () => set({ gameState: null }),
  setGridSize: (gridSize) => set({ gridSize }),

  // Multiplayer state — initial values
  roomId: null,
  playerRole: null,
  playerToken: null,
  opponentName: null,
  connectionStatus: 'idle',
  opponentDisconnected: false,

  // Multiplayer actions
  setRoomId: (roomId) => set({ roomId }),
  setPlayerRole: (playerRole) => set({ playerRole }),
  setPlayerToken: (playerToken) => set({ playerToken }),
  setOpponentName: (opponentName) => set({ opponentName }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setOpponentDisconnected: (opponentDisconnected) => set({ opponentDisconnected }),
  applyServerState: (gameState) => set({ gameState }),
}));
