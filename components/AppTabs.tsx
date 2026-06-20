'use client';

import { BarChart3, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AppTab = 'bets' | 'history';

interface AppTabsProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string; icon: typeof List }[] = [
  { id: 'bets', label: 'Bets', icon: List },
  { id: 'history', label: 'History', icon: BarChart3 },
];

export function AppTabs({ active, onChange }: AppTabsProps) {
  return (
    <nav
      className="mx-auto flex max-w-6xl gap-0.5 border-b border-white/5 px-3 sm:px-6"
      aria-label="Main navigation"
    >
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'flex items-center gap-1 border-b-2 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition sm:px-3',
            active === id
              ? 'border-violet-500 text-violet-300'
              : 'border-transparent text-stone-500 hover:text-stone-300'
          )}
        >
          <Icon className="h-3 w-3" />
          {label}
        </button>
      ))}
    </nav>
  );
}
