import type { LocalGameState, Move } from './types.js';

function getValidMoves(state: LocalGameState): Move[] {
  const moves: Move[] = [];
  state.hLines.forEach((row, r) =>
    row.forEach((drawn, c) => { if (!drawn) moves.push({ type: 'h', row: r, col: c }); })
  );
  state.vLines.forEach((row, r) =>
    row.forEach((drawn, c) => { if (!drawn) moves.push({ type: 'v', row: r, col: c }); })
  );
  return moves;
}

export function pickBotMove(state: LocalGameState): Move | null {
  const moves = getValidMoves(state);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}
