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
  onMove?: (move: Move) => void;
  disabled?: boolean;
  // Multiplayer props
  onLineClick?: (move: Move) => void;
  isMyTurn?: boolean;
}

const GRID_SIZE = 5;
// KINETIC_GRID colors
const P1_COLOR   = '#ffffff';           // Player 1 = white
const P2_COLOR   = '#c3f400';           // Player 2 = electric lime
const LINE_DRAWN = '#4a4a4a';
const LINE_IDLE  = '#252525';
const DOT_COLOR  = '#444444';

function playerColor(p: Player) {
  return p === 'p1' ? P1_COLOR : P2_COLOR;
}

function playerBoxFill(p: Player) {
  return p === 'p1'
    ? { fill: 'url(#p1-box)', stroke: P1_COLOR }
    : { fill: 'url(#p2-box)', stroke: P2_COLOR };
}

export function GameBoard({ gameState, onMove, disabled = false, onLineClick, isMyTurn }: GameBoardProps) {
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const { width, height } = gridToViewBox(GRID_SIZE);
  const hoverColor = playerColor(gameState.currentTurn);

  // Board is disabled if: explicitly disabled, or isMyTurn is explicitly false
  const isDisabled = disabled || isMyTurn === false;

  function handleLineClick(move: Move) {
    if (onLineClick) {
      onLineClick(move);
    } else if (onMove) {
      onMove(move);
    }
  }

  function renderLine(
    key: string,
    coords: { x1: number; y1: number; x2: number; y2: number },
    drawn: boolean,
    move: Move,
  ) {
    const isHovered = hoveredLine === key;
    const stroke = drawn
      ? (gameState.boxes.some(row => row.some(b => b !== null))
          ? (drawn ? LINE_DRAWN : LINE_IDLE)
          : LINE_DRAWN)
      : isHovered ? hoverColor : LINE_IDLE;

    // Determine drawn line color based on which player drew it
    // We infer from box ownership which isn't perfect — use LINE_DRAWN for any drawn line
    const drawnStroke = LINE_DRAWN;

    return (
      <g
        key={key}
        style={{ cursor: drawn ? 'default' : 'crosshair' }}
        onClick={() => { if (!drawn) handleLineClick(move); }}
        onMouseEnter={() => { if (!drawn) setHoveredLine(key); }}
        onMouseLeave={() => setHoveredLine(null)}
      >
        {(drawn || isHovered) && (
          <line
            x1={coords.x1} y1={coords.y1}
            x2={coords.x2} y2={coords.y2}
            stroke={drawn ? drawnStroke : hoverColor}
            strokeWidth={18}
            strokeLinecap="round"
            opacity={drawn ? 0.08 : 0.3}
            style={{ filter: 'blur(4px)' }}
          />
        )}
        <line
          x1={coords.x1} y1={coords.y1}
          x2={coords.x2} y2={coords.y2}
          stroke={drawn ? drawnStroke : isHovered ? hoverColor : LINE_IDLE}
          strokeWidth={drawn ? 5 : isHovered ? 5 : 2}
          strokeLinecap="round"
          style={{
            transition: 'stroke 0.12s ease, stroke-width 0.12s ease',
            filter: isHovered ? `drop-shadow(0 0 8px ${hoverColor}66)` : 'none',
          }}
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
    <div className="relative select-none cursor-crosshair">
      <div
        className="absolute -inset-8 rounded-3xl opacity-25 blur-3xl pointer-events-none transition-all duration-700"
        style={{ background: `radial-gradient(ellipse, ${ambientColor} 0%, transparent 70%)` }}
      />
      <div
        className="relative rounded-none p-2"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #1a1a1a 0%, #0e0e0e 100%)',
          border: '1px solid #252525',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={`w-full max-w-[480px] block${isDisabled ? ' pointer-events-none opacity-60' : ''}`}
        >
          <defs>
            {/* P1 box fill: white/10 tint */}
            <radialGradient id="p1-box" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
            </radialGradient>
            {/* P2 box fill: lime/10 tint */}
            <radialGradient id="p2-box" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#c3f400" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#c3f400" stopOpacity="0.05" />
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
              // P1: white/10 bg + white/40 border; P2: lime/10 bg + lime/40 border
              const borderStroke = owner === 'p1' ? 'rgba(255,255,255,0.4)' : 'rgba(195,244,0,0.4)';
              return (
                <g key={`box-${r}-${c}`} className="animate-box-claim">
                  <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill={fill} rx={0} />
                  <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill="none" stroke={borderStroke} strokeWidth={1} rx={0} />
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

export default GameBoard;
