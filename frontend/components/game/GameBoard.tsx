'use client';

import { useState } from 'react';
import {
  hLineCoords,
  vLineCoords,
  dotPosition,
  boxRect,
  gridToViewBox,
} from '@/lib/gridGeometry';
import type { LocalGameState, Move } from '@/types/game';

interface GameBoardProps {
  gameState: LocalGameState;
  onMove: (move: Move) => void;
  disabled: boolean;
}

const GRID_SIZE = 5;

export function GameBoard({ gameState, onMove, disabled }: GameBoardProps) {
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const { width, height } = gridToViewBox(GRID_SIZE);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full max-w-[480px]${disabled ? ' pointer-events-none' : ''}`}
    >
      {/* Box fills — render first (back layer) */}
      {gameState.boxes.map((row, r) =>
        row.map((owner, c) => {
          if (!owner) return null;
          const rect = boxRect(r, c);
          return (
            <rect
              key={`box-${r}-${c}`}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill={owner === 'p1' ? '#3b82f6' : '#ef4444'}
              opacity={0.4}
            />
          );
        })
      )}

      {/* Horizontal lines — 5 rows × 4 cols */}
      {gameState.hLines.map((row, r) =>
        row.map((drawn, c) => {
          const key = `h-${r}-${c}`;
          const coords = hLineCoords(r, c);
          const isHovered = hoveredLine === key;
          const stroke = drawn ? '#1e293b' : isHovered ? '#94a3b8' : '#e2e8f0';
          return (
            <g
              key={key}
              onClick={() => {
                if (!drawn) onMove({ type: 'h', row: r, col: c });
              }}
              onMouseEnter={() => { if (!drawn) setHoveredLine(key); }}
              onMouseLeave={() => setHoveredLine(null)}
            >
              <line
                x1={coords.x1}
                y1={coords.y1}
                x2={coords.x2}
                y2={coords.y2}
                stroke={stroke}
                strokeWidth={6}
                strokeLinecap="round"
              />
              {!drawn && (
                <line
                  x1={coords.x1}
                  y1={coords.y1}
                  x2={coords.x2}
                  y2={coords.y2}
                  stroke="transparent"
                  strokeWidth={20}
                  className="cursor-pointer"
                />
              )}
            </g>
          );
        })
      )}

      {/* Vertical lines — 4 rows × 5 cols */}
      {gameState.vLines.map((row, r) =>
        row.map((drawn, c) => {
          const key = `v-${r}-${c}`;
          const coords = vLineCoords(r, c);
          const isHovered = hoveredLine === key;
          const stroke = drawn ? '#1e293b' : isHovered ? '#94a3b8' : '#e2e8f0';
          return (
            <g
              key={key}
              onClick={() => {
                if (!drawn) onMove({ type: 'v', row: r, col: c });
              }}
              onMouseEnter={() => { if (!drawn) setHoveredLine(key); }}
              onMouseLeave={() => setHoveredLine(null)}
            >
              <line
                x1={coords.x1}
                y1={coords.y1}
                x2={coords.x2}
                y2={coords.y2}
                stroke={stroke}
                strokeWidth={6}
                strokeLinecap="round"
              />
              {!drawn && (
                <line
                  x1={coords.x1}
                  y1={coords.y1}
                  x2={coords.x2}
                  y2={coords.y2}
                  stroke="transparent"
                  strokeWidth={20}
                  className="cursor-pointer"
                />
              )}
            </g>
          );
        })
      )}

      {/* Dots — render last (top layer) */}
      {Array.from({ length: GRID_SIZE }, (_, r) =>
        Array.from({ length: GRID_SIZE }, (_, c) => {
          const pos = dotPosition(r, c);
          return (
            <circle
              key={`dot-${r}-${c}`}
              cx={pos.cx}
              cy={pos.cy}
              r={6}
              fill="#1e293b"
            />
          );
        })
      )}
    </svg>
  );
}
