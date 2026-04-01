'use client';

import { useRouter } from 'next/navigation';

type NavKey = 'dashboard' | 'leaderboard' | 'lobby' | 'settings';

const links: { key: NavKey; label: string; icon: string; href: string }[] = [
  { key: 'lobby', label: 'GRID', icon: 'grid_view', href: '/lobby' },
  { key: 'leaderboard', label: 'LB', icon: 'leaderboard', href: '/leaderboard' },
  { key: 'dashboard', label: 'DASH', icon: 'bar_chart', href: '/dashboard' },
  { key: 'settings', label: 'CFG', icon: 'settings', href: '/settings' },
];

export function SideNav({ active }: { active: NavKey }) {
  const router = useRouter();
  return (
    <nav className="fixed left-0 top-14 bottom-0 w-16 bg-surface-container-lowest border-r border-outline-variant/10 flex flex-col items-center pt-6 gap-6 z-40">
      {links.map(l => (
        <button
          key={l.key}
          onClick={() => router.push(l.href)}
          className={`flex flex-col items-center gap-1 transition-colors ${active === l.key ? 'text-primary-fixed' : 'text-secondary hover:text-primary'}`}
        >
          <span className="material-symbols-outlined text-xl">{l.icon}</span>
          <span className="font-label text-[8px] tracking-widest uppercase">{l.label}</span>
        </button>
      ))}
    </nav>
  );
}
