// Source: shared/types.ts — copied for Phase 1
// TODO Phase 2: move to shared npm workspace
export type Player = 'p1' | 'p2';

export interface Move {
  type: 'h' | 'v';
  row: number;
  col: number;
}

export interface LocalGameState {
  hLines: boolean[][];
  vLines: boolean[][];
  boxes: (Player | null)[][];
  scores: { p1: number; p2: number };
  currentTurn: Player;
  status: 'active' | 'finished';
  winner: Player | 'draw' | null;
}
