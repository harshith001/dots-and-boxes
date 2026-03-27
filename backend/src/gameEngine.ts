import type { LocalGameState, Move, Player } from './types.js';

export function createInitialState(gridSize = 5): LocalGameState {
  return {
    hLines: Array.from({ length: gridSize }, () => Array(gridSize - 1).fill(null)),
    vLines: Array.from({ length: gridSize - 1 }, () => Array(gridSize).fill(null)),
    boxes: Array.from({ length: gridSize - 1 }, () => Array(gridSize - 1).fill(null)),
    scores: { p1: 0, p2: 0 },
    currentTurn: 'p1',
    status: 'active',
    winner: null,
    gridSize,
  };
}

function findCompletedBoxes(
  hLines: (Player | null)[][],
  vLines: (Player | null)[][],
  existingBoxes: (Player | null)[][]
): Array<{ row: number; col: number }> {
  const completed: Array<{ row: number; col: number }> = [];
  const boxRows = existingBoxes.length;
  const boxCols = existingBoxes[0]?.length ?? 0;
  for (let r = 0; r < boxRows; r++) {
    for (let c = 0; c < boxCols; c++) {
      if (
        existingBoxes[r][c] === null &&
        hLines[r][c] &&
        hLines[r + 1][c] &&
        vLines[r][c] &&
        vLines[r][c + 1]
      ) {
        completed.push({ row: r, col: c });
      }
    }
  }
  return completed;
}

export function applyMove(state: LocalGameState, move: Move, _player: Player): LocalGameState {
  if (state.status !== 'active') return state;

  // Check if line already drawn
  if (move.type === 'h' && state.hLines[move.row][move.col] !== null) return state;
  if (move.type === 'v' && state.vLines[move.row][move.col] !== null) return state;

  // Deep copy line arrays
  const newHLines = state.hLines.map((row) => [...row]);
  const newVLines = state.vLines.map((row) => [...row]);

  if (move.type === 'h') {
    newHLines[move.row][move.col] = state.currentTurn;
  } else {
    newVLines[move.row][move.col] = state.currentTurn;
  }

  // Find newly completed boxes
  const completedBoxes = findCompletedBoxes(newHLines, newVLines, state.boxes);

  // Update boxes array
  const newBoxes = state.boxes.map((row) => [...row]) as (Player | null)[][];
  for (const { row, col } of completedBoxes) {
    newBoxes[row][col] = state.currentTurn;
  }

  // Recalculate scores by counting
  let p1Count = 0;
  let p2Count = 0;
  for (const row of newBoxes) {
    for (const cell of row) {
      if (cell === 'p1') p1Count++;
      else if (cell === 'p2') p2Count++;
    }
  }
  const newScores = { p1: p1Count, p2: p2Count };

  // Check game end
  const totalFilled = p1Count + p2Count;
  let newStatus: 'active' | 'finished' = 'active';
  let newWinner: Player | 'draw' | null = null;

  const totalBoxes = newBoxes.length * (newBoxes[0]?.length ?? 0);
  if (totalFilled === totalBoxes) {
    newStatus = 'finished';
    if (p1Count > p2Count) newWinner = 'p1';
    else if (p2Count > p1Count) newWinner = 'p2';
    else newWinner = 'draw';
  }

  // Turn management: keep turn if box completed, switch otherwise
  const newTurn: Player =
    completedBoxes.length > 0
      ? state.currentTurn
      : state.currentTurn === 'p1'
        ? 'p2'
        : 'p1';

  return {
    hLines: newHLines,
    vLines: newVLines,
    boxes: newBoxes,
    scores: newScores,
    currentTurn: newTurn,
    status: newStatus,
    winner: newWinner,
    gridSize: state.gridSize,
  };
}
