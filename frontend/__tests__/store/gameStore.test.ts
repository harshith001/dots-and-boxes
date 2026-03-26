import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';

describe('gameStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useGameStore.setState({ gameState: null });
  });

  it('initial state has gameState null', () => {
    expect(useGameStore.getState().gameState).toBeNull();
  });

  it('startGame sets gameState to active game', () => {
    useGameStore.getState().startGame();
    const gs = useGameStore.getState().gameState;
    expect(gs).not.toBeNull();
    expect(gs!.status).toBe('active');
    expect(gs!.currentTurn).toBe('p1');
    expect(gs!.hLines.length).toBe(5);
  });

  it('makeMove draws a line', () => {
    useGameStore.getState().startGame();
    useGameStore.getState().makeMove({ type: 'h', row: 0, col: 0 });
    const gs = useGameStore.getState().gameState;
    expect(gs!.hLines[0][0]).toBe(true);
  });

  it('makeMove on null gameState is no-op', () => {
    // Should not throw
    useGameStore.getState().makeMove({ type: 'h', row: 0, col: 0 });
    expect(useGameStore.getState().gameState).toBeNull();
  });

  it('makeMove on finished game is no-op', () => {
    useGameStore.getState().startGame();
    // Manually set finished
    useGameStore.setState((s) => ({
      gameState: s.gameState ? { ...s.gameState, status: 'finished' as const } : null,
    }));
    const before = useGameStore.getState().gameState;
    useGameStore.getState().makeMove({ type: 'h', row: 1, col: 1 });
    expect(useGameStore.getState().gameState).toEqual(before);
  });

  it('resetGame sets gameState to null', () => {
    useGameStore.getState().startGame();
    useGameStore.getState().resetGame();
    expect(useGameStore.getState().gameState).toBeNull();
  });
});
