import type { Player } from '@/types/game';

interface PlayerCardProps {
  player: Player;
  name: string;
  score: number;
  isActive: boolean;
}

export function PlayerCard({ player, name, score, isActive }: PlayerCardProps) {
  const ringClass =
    isActive
      ? player === 'p1'
        ? 'ring-2 ring-blue-400'
        : 'ring-2 ring-red-400'
      : 'opacity-60';

  const scoreColorClass = player === 'p1' ? 'text-blue-500' : 'text-red-500';

  return (
    <div className={`bg-white rounded-2xl p-6 ${ringClass}`}>
      <p className="text-base font-normal text-slate-700">{name}</p>
      <p className={`text-xl font-semibold ${scoreColorClass}`}>{score}</p>
      <p className="text-sm text-slate-400">boxes</p>
    </div>
  );
}
