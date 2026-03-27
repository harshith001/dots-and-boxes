'use client';

interface PlayerCardProps {
  name: string;
  score: number;
  role: 'p1' | 'p2';
  isActive: boolean;
  isMe: boolean;
}

export function PlayerCard({ name, score, role, isActive, isMe }: PlayerCardProps) {
  const isP1 = role === 'p1';
  // P1 = white, P2 = electric lime (matching KINETIC_GRID board colors)
  const accentColor = isP1 ? '#ffffff' : '#c3f400';
  const accentDim   = isP1 ? 'rgba(255,255,255,0.06)' : 'rgba(195,244,0,0.06)';

  return (
    <div
      className="relative flex flex-col gap-3 p-4 transition-all duration-300"
      style={{
        background: isActive ? `linear-gradient(160deg, ${accentDim}, #0e0e0e 70%)` : '#0e0e0e',
        border: `1px solid ${isActive ? accentColor + '30' : '#252525'}`,
        opacity: isActive ? 1 : 0.4,
      }}
    >
      {/* Accent top edge */}
      <div
        className="absolute top-0 left-0 right-0 h-px transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          opacity: isActive ? 1 : 0,
        }}
      />

      {/* Role badge */}
      <div
        className="w-8 h-8 flex items-center justify-center font-headline text-[10px] font-bold tracking-widest"
        style={{
          border: `1px solid ${accentColor}25`,
          color: accentColor,
        }}
      >
        {isP1 ? 'P1' : 'P2'}
      </div>

      {/* Name */}
      <div className="font-label text-[10px] tracking-widest uppercase truncate" style={{ color: '#5a5a5a' }}>
        {isMe ? `${name} (YOU)` : name}
      </div>

      {/* Score */}
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-headline text-4xl font-black tabular-nums"
          style={{
            color: accentColor,
            textShadow: isActive ? `0 0 24px ${accentColor}60` : 'none',
            transition: 'text-shadow 0.3s ease',
          }}
        >
          {score}
        </span>
        <span className="font-label text-[9px] tracking-widest" style={{ color: '#3a3a3a' }}>PTS</span>
      </div>

      {/* Active indicator */}
      <div className="flex items-center gap-2 h-4">
        {isActive ? (
          <>
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: accentColor, boxShadow: `0 0 6px ${accentColor}` }}
            />
            <span className="font-label text-[9px] tracking-widest uppercase" style={{ color: accentColor }}>
              YOUR TURN
            </span>
          </>
        ) : (
          <span className="font-label text-[9px] tracking-widest uppercase" style={{ color: '#252525' }}>
            WAITING
          </span>
        )}
      </div>
    </div>
  );
}
