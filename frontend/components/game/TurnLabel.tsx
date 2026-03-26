import type { Player } from '@/types/game';

interface TurnLabelProps {
  currentTurn: Player;
}

export function TurnLabel({ currentTurn }: TurnLabelProps) {
  const isP1  = currentTurn === 'p1';
  const color = isP1 ? '#38bdf8' : '#f472b6';
  const name  = isP1 ? 'Player 1' : 'Player 2';

  return (
    <div
      key={currentTurn}
      className="animate-turn-slide flex items-center gap-2.5 px-5 py-2 rounded-full"
      style={{
        background: `linear-gradient(135deg, ${color}15, ${color}06)`,
        border: `1px solid ${color}30`,
      }}
    >
      <div
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span
        className="text-xs font-bold tracking-widest uppercase"
        style={{ color }}
      >
        {name} &mdash; Your move
      </span>
    </div>
  );
}
