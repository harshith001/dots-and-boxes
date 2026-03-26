import type { Player } from '@/types/game';

interface TurnLabelProps {
  currentTurn: Player;
}

export function TurnLabel({ currentTurn }: TurnLabelProps) {
  const colorClass = currentTurn === 'p1' ? 'text-blue-500' : 'text-red-500';
  const label =
    currentTurn === 'p1' ? "Player 1's turn" : "Player 2's turn";

  return <p className={`text-base font-normal ${colorClass}`}>{label}</p>;
}
