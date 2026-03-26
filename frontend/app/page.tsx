import Link from 'next/link';

export default function Home() {
  return (
    <main
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #0f1e3a 0%, #07090f 55%)' }}
    >
      {/* Background dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04] animate-bg-drift"
        style={{
          backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Ambient top glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'linear-gradient(180deg, #38bdf8 0%, #f472b6 100%)' }}
      />

      <div className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center gap-8">
        {/* Logo mark */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5 mb-1">
            {['#38bdf8', '#f472b6', '#38bdf8', '#f472b6'].map((c, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: c,
                  boxShadow: `0 0 8px ${c}`,
                  animationDelay: `${i * 0.4}s`,
                }}
              />
            ))}
          </div>
          <h1
            className="text-5xl font-black tracking-tight text-center"
            style={{
              background: 'linear-gradient(135deg, #e2e8f0 30%, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.03em',
            }}
          >
            Dots&nbsp;&amp;&nbsp;Boxes
          </h1>
          <p className="text-xs font-medium tracking-widest uppercase" style={{ color: '#334155' }}>
            Claim the grid. Outplay the opponent.
          </p>
        </div>

        {/* Form */}
        <div className="w-full flex flex-col gap-3">
          <div className="relative">
            <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ color: '#38bdf8' }}>
              Player 1
            </label>
            <input
              type="text"
              placeholder="Enter name"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 placeholder-slate-600"
              style={{
                background: '#0d1117',
                border: '1px solid #1e2a3a',
                color: '#e2e8f0',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#38bdf880'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#1e2a3a'; }}
            />
          </div>
          <div className="relative">
            <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ color: '#f472b6' }}>
              Player 2
            </label>
            <input
              type="text"
              placeholder="Enter name"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 placeholder-slate-600"
              style={{
                background: '#0d1117',
                border: '1px solid #1e2a3a',
                color: '#e2e8f0',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#f472b680'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#1e2a3a'; }}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="w-full flex flex-col items-center gap-4">
          <Link
            href="/game"
            className="relative w-full text-center text-sm font-bold tracking-widest uppercase py-4 rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
              color: '#07090f',
              boxShadow: '0 0 30px rgba(56,189,248,0.3), 0 0 60px rgba(56,189,248,0.15)',
            }}
          >
            Start Game
          </Link>
          <p className="text-xs" style={{ color: '#1e2a3a' }}>5×5 grid · Hot-seat · 16 boxes</p>
        </div>
      </div>
    </main>
  );
}
