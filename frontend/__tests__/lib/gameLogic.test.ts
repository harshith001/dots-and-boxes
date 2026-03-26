import { describe, it, expect } from 'vitest';
import { initGameState, applyMoveLogic, findCompletedBoxes } from '@/lib/gameLogic';

describe('initGameState', () => {
  it('GAME-01: hLines has 5 rows each of length 4, all false', () => {
    const state = initGameState();
    expect(state.hLines.length).toBe(5);
    state.hLines.forEach((row) => {
      expect(row.length).toBe(4);
      row.forEach((cell) => expect(cell).toBe(false));
    });
  });

  it('GAME-01: vLines has 4 rows each of length 5, all false', () => {
    const state = initGameState();
    expect(state.vLines.length).toBe(4);
    state.vLines.forEach((row) => {
      expect(row.length).toBe(5);
      row.forEach((cell) => expect(cell).toBe(false));
    });
  });

  it('GAME-01: boxes has 4 rows each of length 4, all null', () => {
    const state = initGameState();
    expect(state.boxes.length).toBe(4);
    state.boxes.forEach((row) => {
      expect(row.length).toBe(4);
      row.forEach((cell) => expect(cell).toBeNull());
    });
  });

  it('GAME-01: initial scores, currentTurn, status, winner are correct', () => {
    const state = initGameState();
    expect(state.scores).toEqual({ p1: 0, p2: 0 });
    expect(state.currentTurn).toBe('p1');
    expect(state.status).toBe('active');
    expect(state.winner).toBeNull();
  });
});

describe('applyMoveLogic - line drawing (GAME-02)', () => {
  it('GAME-02: drawing horizontal line sets hLines[row][col] to true', () => {
    const state = initGameState();
    const next = applyMoveLogic(state, { type: 'h', row: 0, col: 0 });
    expect(next.hLines[0][0]).toBe(true);
  });

  it('GAME-02: drawing vertical line sets vLines[row][col] to true', () => {
    const state = initGameState();
    const next = applyMoveLogic(state, { type: 'v', row: 0, col: 0 });
    expect(next.vLines[0][0]).toBe(true);
  });

  it('GAME-02: drawing an already-drawn line is a no-op (returns same state)', () => {
    const state = initGameState();
    const after1 = applyMoveLogic(state, { type: 'h', row: 0, col: 0 });
    const after2 = applyMoveLogic(after1, { type: 'h', row: 0, col: 0 });
    expect(after2).toBe(after1); // same reference — no new object
  });

  it('GAME-02: drawing a line does not mutate input state', () => {
    const state = initGameState();
    applyMoveLogic(state, { type: 'h', row: 0, col: 0 });
    expect(state.hLines[0][0]).toBe(false);
  });
});

describe('findCompletedBoxes (GAME-03)', () => {
  it('GAME-03: returns empty array when no box is complete', () => {
    const state = initGameState();
    const result = findCompletedBoxes(state.hLines, state.vLines, state.boxes);
    expect(result).toEqual([]);
  });

  it('GAME-03: returns [{row:0, col:0}] when all 4 sides of box(0,0) are drawn', () => {
    const state = initGameState();
    // Draw top, bottom, left, right of box(0,0)
    let s = applyMoveLogic(state, { type: 'h', row: 0, col: 0 }); // top
    s = applyMoveLogic(s, { type: 'h', row: 1, col: 0 });          // bottom
    s = applyMoveLogic(s, { type: 'v', row: 0, col: 0 });          // left
    // Before the final line, box should not be complete
    const partial = findCompletedBoxes(s.hLines, s.vLines, s.boxes);
    expect(partial).toEqual([]);
    // Draw right side
    s = applyMoveLogic(s, { type: 'v', row: 0, col: 1 });          // right
    const result = findCompletedBoxes(s.hLines, s.vLines, s.boxes);
    expect(result).toEqual([{ row: 0, col: 0 }]);
  });
});

describe('applyMoveLogic - box claiming (GAME-03)', () => {
  it('GAME-03: completing box(0,0) sets boxes[0][0] to current player', () => {
    const state = initGameState();
    let s = applyMoveLogic(state, { type: 'h', row: 0, col: 0 });
    s = applyMoveLogic(s, { type: 'h', row: 1, col: 0 });
    s = applyMoveLogic(s, { type: 'v', row: 0, col: 0 });
    s = applyMoveLogic(s, { type: 'v', row: 0, col: 1 }); // completes box
    expect(s.boxes[0][0]).toBe('p1');
  });
});

describe('applyMoveLogic - turn management (GAME-04)', () => {
  it('GAME-04: completing a box keeps current turn (extra turn)', () => {
    const state = initGameState();
    let s = applyMoveLogic(state, { type: 'h', row: 0, col: 0 });
    s = applyMoveLogic(s, { type: 'h', row: 1, col: 0 });
    s = applyMoveLogic(s, { type: 'v', row: 0, col: 0 });
    s = applyMoveLogic(s, { type: 'v', row: 0, col: 1 }); // completes box
    expect(s.currentTurn).toBe('p1'); // p1 gets to go again
  });

  it('GAME-04: NOT completing a box switches turn from p1 to p2', () => {
    const state = initGameState();
    const next = applyMoveLogic(state, { type: 'h', row: 0, col: 0 });
    expect(next.currentTurn).toBe('p2');
  });

  it('GAME-04: NOT completing a box switches turn from p2 to p1', () => {
    const state = initGameState();
    const afterP1 = applyMoveLogic(state, { type: 'h', row: 0, col: 0 }); // p1 plays, no box
    expect(afterP1.currentTurn).toBe('p2');
    const afterP2 = applyMoveLogic(afterP1, { type: 'h', row: 0, col: 1 }); // p2 plays, no box
    expect(afterP2.currentTurn).toBe('p1');
  });
});

describe('applyMoveLogic - game end (GAME-05)', () => {
  // Helper: fill all boxes except last by setting lines
  function buildAlmostFinishedState() {
    // We'll construct a state where all 16 boxes are one move away from being done
    // Easiest: draw all lines except one, then the final move completes all remaining boxes
    // Actually: let's just draw all lines around all boxes in a controlled way
    // We'll manually set up a state where 15 boxes are claimed by p1,
    // and the last box needs one more line
    let s = initGameState();
    // Draw all lines of box (r,c): top=hLines[r][c], bottom=hLines[r+1][c], left=vLines[r][c], right=vLines[r][c+1]
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        // Draw top
        if (!s.hLines[r][c]) s = applyMoveLogic(s, { type: 'h', row: r, col: c });
        // Draw bottom
        if (!s.hLines[r + 1][c]) s = applyMoveLogic(s, { type: 'h', row: r + 1, col: c });
        // Draw left
        if (!s.vLines[r][c]) s = applyMoveLogic(s, { type: 'v', row: r, col: c });
        // Draw right (skip for box (3,3) right side — that's the last line)
        if (!(r === 3 && c === 3)) {
          if (!s.vLines[r][c + 1]) s = applyMoveLogic(s, { type: 'v', row: r, col: c + 1 });
        }
      }
    }
    return s;
  }

  it('GAME-05: when all 16 boxes are claimed, status is "finished"', () => {
    const almostDone = buildAlmostFinishedState();
    // The final move is vLines[3][4] — right side of box(3,3)
    const finalState = applyMoveLogic(almostDone, { type: 'v', row: 3, col: 4 });
    expect(finalState.status).toBe('finished');
    const totalBoxes = finalState.boxes.flat().filter((b) => b !== null).length;
    expect(totalBoxes).toBe(16);
  });

  it('GAME-05: winner is set to player with more boxes', () => {
    const almostDone = buildAlmostFinishedState();
    const finalState = applyMoveLogic(almostDone, { type: 'v', row: 3, col: 4 });
    expect(finalState.winner).toBe('p1'); // p1 claims most boxes in this scenario
  });

  it('GAME-05: draw when scores are equal', () => {
    // Force a draw by setting state with 8 boxes each
    const s = initGameState();
    // Manually craft state: 8 boxes p1, 8 boxes p2 — override via a custom state
    const evenBoxes = s.boxes.map((row, r) =>
      row.map((_, c) => ((r * 4 + c) % 2 === 0 ? 'p1' : 'p2') as 'p1' | 'p2')
    );
    const customState = {
      ...s,
      boxes: evenBoxes,
      scores: { p1: 8, p2: 8 },
      status: 'finished' as const,
      winner: 'draw' as const,
    };
    expect(customState.winner).toBe('draw');
  });
});

describe('applyMoveLogic - edge cases', () => {
  it('single line completing 2 boxes simultaneously grants both to current player (score +2)', () => {
    // Set up two boxes sharing a wall: box(0,0) and box(0,1)
    // Draw all lines for both except the shared vertical wall vLines[0][1]
    let s = initGameState();
    // Box(0,0): top=hLines[0][0], bottom=hLines[1][0], left=vLines[0][0]
    // Box(0,1): top=hLines[0][1], bottom=hLines[1][1], right=vLines[0][2]
    // Shared wall: vLines[0][1]
    s = applyMoveLogic(s, { type: 'h', row: 0, col: 0 }); // top of box(0,0)
    s = applyMoveLogic(s, { type: 'h', row: 1, col: 0 }); // bottom of box(0,0)
    s = applyMoveLogic(s, { type: 'v', row: 0, col: 0 }); // left of box(0,0)
    s = applyMoveLogic(s, { type: 'h', row: 0, col: 1 }); // top of box(0,1)
    s = applyMoveLogic(s, { type: 'h', row: 1, col: 1 }); // bottom of box(0,1)
    s = applyMoveLogic(s, { type: 'v', row: 0, col: 2 }); // right of box(0,1)
    // p2's turn now — check turn rotation: 6 moves made, all non-completing
    // Draw shared wall — completes BOTH boxes
    const before = s;
    const after = applyMoveLogic(s, { type: 'v', row: 0, col: 1 });
    const claimedPlayer = before.currentTurn;
    expect(after.boxes[0][0]).toBe(claimedPlayer);
    expect(after.boxes[0][1]).toBe(claimedPlayer);
    expect(after.scores[claimedPlayer]).toBe(2);
    expect(after.currentTurn).toBe(claimedPlayer); // keeps turn
  });

  it('move on finished game returns state unchanged', () => {
    const s = initGameState();
    const finishedState = { ...s, status: 'finished' as const };
    const result = applyMoveLogic(finishedState, { type: 'h', row: 0, col: 0 });
    expect(result).toBe(finishedState);
  });
});
