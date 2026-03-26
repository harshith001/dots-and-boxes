'use client';

import { useState } from 'react';
import {
  hLineCoords,
  vLineCoords,
  dotPosition,
  boxRect,
  gridToViewBox,
} from '@/lib/gridGeometry';
import type { LocalGameState, Move, Player } from '@/types/game';

interface GameBoardProps {
  gameState: LocalGameState;
  onMove: (move: Move) => void;
  disabled: boolean;
}

const GRID_SIZE = 5;
const P1_COLOR   = '#38bdf8';
const P2_COLOR   = '#f472b6';
const LINE_DRAWN = '#cbd5e1';
const LINE_IDLE  = '#1a2744';
const DOT_COLOR  = '#64748b';

function playerColor(p: Player) {
  return p === 'p1' ? P1_COLOR : P2_COLOR;
}

function playerBoxFill(p: Player) {
  return p === 'p1'
    ? { fill: 'url(#p1-box)', stroke: P1_COLOR }
    : { fill: 'url(#p2-box)', stroke: P2_COLOR };
}

export function GameBoard({ gameState, onMove, disabled }: GameBoardProps) {
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const { width, height } = gridToViewBox(GRID_SIZE);
  const hoverColor = playerColor(gameState.currentTurn);

  function renderLine(
    key: string,
    coords: { x1: number; y1: number; x2: number; y2: number },
    drawn: boolean,
    move: Move,
  ) {
    const isHovered = hoveredLine === key;
    const stroke = drawn ? LINE_DRAWN : isHovered ? hoverColor : LINE_IDLE;

    return (
      <g
        key={key}
        style={{ cursor: drawn ? 'default' : 'pointer' }}
        onClick={() => { if (!drawn) onMove(move); }}
        onMouseEnter={() => { if (!drawn) setHoveredLine(key); }}
        onMouseLeave={() => setHoveredLine(null)}
      >
        {(drawn || isHovered) && (
          <line
            x1={coords.x1} y1={coords.y1}
            x2={coords.x2} y2={coords.y2}
            stroke={drawn ? LINE_DRAWN : hoverColor}
            strokeWidth={18}
            strokeLinecap="round"
            opacity={drawn ? 0.08 : 0.3}
            style={{ filter: 'blur(4px)' }}
          />
        )}
        <line
          x1={coords.x1} y1={coords.y1}
          x2={coords.x2} y2={coords.y2}
          stroke={stroke}
          strokeWidth={drawn ? 5 : isHovered ? 5 : 2}
          strokeLinecap="round"
          style={{ transition: 'stroke 0.12s ease, stroke-width 0.12s ease' }}
        />
        {!drawn && (
          <line
            x1={coords.x1} y1={coords.y1}
            x2={coords.x2} y2={coords.y2}
            stroke="transparent"
            strokeWidth={24}
          />
        )}
      </g>
    );
  }

  const ambientColor = playerColor(gameState.currentTurn);

  return (
    <div className="relative select-none">
      <div
        className="absolute -inset-8 rounded-3xl opacity-25 blur-3xl pointer-events-none transition-all duration-700"
        style={{ background: `radial-gradient(ellipse, ${ambientColor} 0%, transparent 70%)` }}
      />
      <div
        className="relative rounded-2xl p-2"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #0f1e3a 0%, #06090f 100%)',
          border: '1px solid #1a2744',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={`w-full max-w-[480px] block${disabled ? ' pointer-events-none' : ''}`}
        >
          <defs>
            <radialGradient id="p1-box" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.35" />
            </radialGradient>
            <radialGradient id="p2-box" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#f9a8d4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#9d174d" stopOpacity="0.35" />
            </radialGradient>
            <filter id="dot-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {gameState.boxes.map((row, r) =>
            row.map((owner, c) => {
              if (!owner) return null;
              const rect = boxRect(r, c);
              const { fill, stroke } = playerBoxFill(owner);
              return (
                <g key={`box-${r}-${c}`} className="animate-box-claim">
                  <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill={fill} rx={6} />
                  <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill="none" stroke={stroke} strokeWidth={1} strokeOpacity={0.3} rx={6} />
                </g>
              );
            })
          )}

          {gameState.hLines.map((row, r) =>
            row.map((drawn, c) =>
              renderLine(`h-${r}-${c}`, hLineCoords(r, c), drawn, { type: 'h', row: r, col: c })
            )
          )}

          {gameState.vLines.map((row, r) =>
            row.map((drawn, c) =>
              renderLine(`v-${r}-${c}`, vLineCoords(r, c), drawn, { type: 'v', row: r, col: c })
            )
          )}

          {Array.from({ length: GRID_SIZE }, (_, r) =>
            Array.from({ length: GRID_SIZE }, (_, c) => {
              const { cx, cy } = dotPosition(r, c);
              return (
                <circle key={`dot-${r}-${c}`} cx={cx} cy={cy} r={7} fill={DOT_COLOR} filter="url(#dot-glow)" />
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
}
