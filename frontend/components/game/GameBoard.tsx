'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
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

// KINETIC_GRID colors
const P1_COLOR = '#ffffff';     // Player 1 = white
const P2_COLOR = '#c3f400';     // Player 2 = electric lime
const LINE_IDLE = '#2a2a2a';
const DOT_COLOR = '#555555';

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
  const dotRows = gameState.hLines.length;
  const { width, height } = gridToViewBox(dotRows);
  const hoverColor = playerColor(gameState.currentTurn);

  // Track which lines and boxes were already present — used to detect newly drawn/claimed
  const drawnLinesRef = useRef<Set<string>>(new Set());
  const claimedBoxesRef = useRef<Set<string>>(new Set());

  // Initialize refs from current gameState on mount (so existing lines/boxes don't animate)
  useEffect(() => {
    const lines = new Set<string>();
    gameState.hLines.forEach((row, r) => {
      row.forEach((val, c) => { if (val !== null) lines.add(`h-${r}-${c}`); });
    });
    gameState.vLines.forEach((row, r) => {
      row.forEach((val, c) => { if (val !== null) lines.add(`v-${r}-${c}`); });
    });
    drawnLinesRef.current = lines;

    const boxes = new Set<string>();
    gameState.boxes.forEach((row, r) => {
      row.forEach((owner, c) => { if (owner) boxes.add(`box-${r}-${c}`); });
    });
    claimedBoxesRef.current = boxes;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    drawnBy: Player | null,
    move: Move,
  ) {
    const isHovered = hoveredLine === key;
    const lineLength = Math.hypot(coords.x2 - coords.x1, coords.y2 - coords.y1);
    const isNewlyDrawn = drawnBy !== null && !drawnLinesRef.current.has(key);

    if (drawnBy !== null) {
      drawnLinesRef.current.add(key);
    }

    const drawnColor = drawnBy ? playerColor(drawnBy) : LINE_IDLE;

    return (
      <g
        key={key}
        style={{ cursor: drawnBy ? 'default' : 'crosshair' }}
        onClick={() => { if (!drawnBy) handleLineClick(move); }}
        onMouseEnter={() => { if (!drawnBy) setHoveredLine(key); }}
        onMouseLeave={() => setHoveredLine(null)}
      >
        {/* Glow layer: drawn lines get a soft player-color glow; hover gets a strong glow */}
        {(drawnBy || isHovered) && (
          <line
            x1={coords.x1} y1={coords.y1}
            x2={coords.x2} y2={coords.y2}
            stroke={drawnBy ? drawnColor : hoverColor}
            strokeWidth={isHovered ? 22 : 14}
            strokeLinecap="round"
            opacity={isHovered ? 0.35 : 0.12}
            style={{ filter: `blur(${isHovered ? 6 : 4}px)` }}
          />
        )}
        {/* Main line */}
        <line
          x1={coords.x1} y1={coords.y1}
          x2={coords.x2} y2={coords.y2}
          stroke={drawnBy ? drawnColor : isHovered ? hoverColor : LINE_IDLE}
          strokeWidth={drawnBy ? 5 : isHovered ? 5 : 2}
          strokeLinecap="round"
          strokeDasharray={isNewlyDrawn ? lineLength : undefined}
          className={isNewlyDrawn ? 'animate-line-draw' : undefined}
          style={{
            transition: !isNewlyDrawn ? 'stroke 0.12s ease, stroke-width 0.12s ease' : undefined,
            filter: isHovered
              ? `drop-shadow(0 0 10px ${hoverColor}) drop-shadow(0 0 4px ${hoverColor})`
              : drawnBy
                ? `drop-shadow(0 0 3px ${drawnColor}66)`
                : 'none',
            ...( isNewlyDrawn ? { '--line-length': lineLength } as CSSProperties : {} ),
          }}
        />
        {/* Invisible wide hit area for easy clicking */}
        {!drawnBy && (
          <line
            x1={coords.x1} y1={coords.y1}
            x2={coords.x2} y2={coords.y2}
            stroke="transparent"
            strokeWidth={28}
          />
        )}
      </g>
    );
  }

  const ambientColor = playerColor(gameState.currentTurn);

  return (
    <div className="relative select-none cursor-crosshair w-full">
      <div
        className="absolute -inset-8 rounded-3xl opacity-20 blur-3xl pointer-events-none transition-all duration-700"
        style={{ background: `radial-gradient(ellipse, ${ambientColor} 0%, transparent 70%)` }}
      />
      <div
        className="relative"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #1a1a1a 0%, #0e0e0e 100%)',
          border: '1px solid #252525',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={`w-full block${isDisabled ? ' pointer-events-none opacity-60' : ''}`}
        >
          <defs>
            {/* P1 box fill: white tint */}
            <radialGradient id="p1-box" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
            </radialGradient>
            {/* P2 box fill: lime tint */}
            <radialGradient id="p2-box" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#c3f400" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#c3f400" stopOpacity="0.06" />
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
              const { fill } = playerBoxFill(owner);
              const boxKey = `box-${r}-${c}`;
              const isNewlyClaimed = !claimedBoxesRef.current.has(boxKey);
              if (owner) claimedBoxesRef.current.add(boxKey);

              const borderStroke = owner === 'p1' ? 'rgba(255,255,255,0.4)' : 'rgba(195,244,0,0.4)';
              return (
                <g
                  key={boxKey}
                  className={isNewlyClaimed ? 'animate-box-claim' : undefined}
                  style={isNewlyClaimed ? { transformBox: 'fill-box', transformOrigin: 'center' } : undefined}
                >
                  <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill={fill} />
                  <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill="none" stroke={borderStroke} strokeWidth={1} />
                </g>
              );
            })
          )}

          {gameState.hLines.map((row, r) =>
            row.map((drawnBy, c) =>
              renderLine(`h-${r}-${c}`, hLineCoords(r, c), drawnBy, { type: 'h', row: r, col: c })
            )
          )}

          {gameState.vLines.map((row, r) =>
            row.map((drawnBy, c) =>
              renderLine(`v-${r}-${c}`, vLineCoords(r, c), drawnBy, { type: 'v', row: r, col: c })
            )
          )}

          {Array.from({ length: dotRows }, (_, r) =>
            Array.from({ length: dotRows }, (_, c) => {
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
