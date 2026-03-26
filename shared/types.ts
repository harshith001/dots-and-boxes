export type Player = 'p1' | 'p2';

export interface Move {
  type: 'h' | 'v';
  row: number;
  col: number;
}

export interface LocalGameState {
  hLines: boolean[][];      // 5 rows x 4 cols for 5x5 grid
  vLines: boolean[][];      // 4 rows x 5 cols for 5x5 grid
  boxes: (Player | null)[][]; // 4 rows x 4 cols
  scores: { p1: number; p2: number };
  currentTurn: Player;
  status: 'active' | 'finished';
  winner: Player | 'draw' | null;
}
