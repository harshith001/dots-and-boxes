import type { Player } from '@/types/game';

interface PlayerCardProps {
  player: Player;
  name: string;
  score: number;
  isActive: boolean;
}

export function PlayerCard({ player, name, score, isActive }: PlayerCardProps) {
  const isP1     = player === 'p1';
  const color    = isP1 ? '#38bdf8' : '#f472b6';
  const dimColor = isP1 ? 'rgba(56,189,248,0.12)' : 'rgba(244,114,182,0.12)';
  const glowClass = isActive ? (isP1 ? 'animate-glow-p1' : 'animate-glow-p2') : '';

  return (
    <div
      className={`relative rounded-2xl p-5 transition-all duration-500 ${glowClass}`}
      style={{
        background: isActive
          ? `linear-gradient(145deg, ${dimColor}, #0d1117 60%)`
          : 'linear-gradient(145deg, #0d1117, #0a0e1a)',
        border: `1px solid ${isActive ? color + '40' : '#1e2a3a'}`,
        transform: isActive ? 'scale(1.02)' : 'scale(1)',
        transition: 'transform 0.3s ease, border-color 0.3s ease, background 0.3s ease',
      }}
    >
      {/* Active top edge accent */}
      <div
        className="absolute top-0 left-1/4 right-1/4 h-px rounded-full transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: isActive ? 1 : 0,
        }}
      />

      {/* Player badge */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold tracking-widest mb-4"
        style={{
          background: `linear-gradient(135deg, ${color}25, ${color}08)`,
          border: `1px solid ${color}30`,
          color,
        }}
      >
        {isP1 ? 'P1' : 'P2'}
      </div>

      <p className="text-xs font-medium tracking-widest uppercase mb-2" style={{ color: '#475569' }}>
        {name}
      </p>

      <div className="flex items-baseline gap-2">
        <span
          className="text-5xl font-black tabular-nums"
          style={{
            color,
            textShadow: isActive ? `0 0 30px ${color}80` : 'none',
            transition: 'text-shadow 0.3s ease',
          }}
        >
          {score}
        </span>
        <span className="text-xs" style={{ color: '#334155' }}>boxes</span>
      </div>

      {/* Status pill */}
      <div className="mt-4 flex items-center gap-2 h-5">
        {isActive ? (
          <>
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
            />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color }}>
              Your turn
            </span>
          </>
        ) : (
          <span className="text-xs tracking-widest uppercase" style={{ color: '#1e2a3a' }}>
            Waiting
          </span>
        )}
      </div>
    </div>
  );
}
