const DOT_SPACING = 80;
const DOT_RADIUS = 6;
const PADDING = 40;

export function gridToViewBox(gridSize: number) {
  const size = PADDING * 2 + DOT_SPACING * (gridSize - 1);
  return { width: size, height: size };
}

export function dotPosition(row: number, col: number) {
  return {
    cx: PADDING + col * DOT_SPACING,
    cy: PADDING + row * DOT_SPACING,
  };
}

export function hLineCoords(row: number, col: number) {
  const x1 = PADDING + col * DOT_SPACING + DOT_RADIUS;
  const y1 = PADDING + row * DOT_SPACING;
  const x2 = PADDING + (col + 1) * DOT_SPACING - DOT_RADIUS;
  const y2 = y1;
  return { x1, y1, x2, y2 };
}

export function vLineCoords(row: number, col: number) {
  const x1 = PADDING + col * DOT_SPACING;
  const y1 = PADDING + row * DOT_SPACING + DOT_RADIUS;
  const x2 = x1;
  const y2 = PADDING + (row + 1) * DOT_SPACING - DOT_RADIUS;
  return { x1, y1, x2, y2 };
}

export function boxRect(row: number, col: number) {
  const x = PADDING + col * DOT_SPACING + DOT_RADIUS;
  const y = PADDING + row * DOT_SPACING + DOT_RADIUS;
  const size = DOT_SPACING - DOT_RADIUS * 2;
  return { x, y, width: size, height: size };
}
