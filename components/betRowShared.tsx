'use client';

import type { BetOutcome } from '@/lib/types';
import { cn } from '@/lib/utils';

export const OUTCOME_CYCLE: BetOutcome[] = ['pending', 'win', 'loss', 'push'];

export function cycleOutcome(current: BetOutcome): BetOutcome {
  const i = OUTCOME_CYCLE.indexOf(current);
  return OUTCOME_CYCLE[(i + 1) % OUTCOME_CYCLE.length];
}

export function outcomeDot(outcome: BetOutcome) {
  switch (outcome) {
    case 'win':
      return 'bg-emerald-500';
    case 'loss':
      return 'bg-red-500';
    case 'push':
      return 'bg-yellow-500';
    default:
      return 'bg-violet-500/60';
  }
}

export function outcomeAbbrev(outcome: BetOutcome) {
  switch (outcome) {
    case 'win':
      return 'W';
    case 'loss':
      return 'L';
    case 'push':
      return 'P';
    default:
      return '·';
  }
}

export function outcomePlClass(outcome: BetOutcome): string {
  switch (outcome) {
    case 'win':
      return 'text-emerald-400';
    case 'loss':
      return 'text-red-400';
    case 'push':
      return 'text-yellow-400';
    default:
      return 'text-stone-600';
  }
}

export const compactInputClass =
  'min-w-0 rounded border border-white/10 bg-stone-950/50 px-1 py-0.5 text-[11px] text-stone-200 placeholder:text-stone-600 outline-none focus:border-violet-500/40 sm:px-1.5 sm:text-xs';

interface OutcomePillProps {
  outcome: BetOutcome;
  onClick: () => void;
}

export function OutcomePill({ outcome, onClick }: OutcomePillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 text-[10px] font-bold transition active:scale-95',
        outcome === 'win' && 'border-emerald-500/30 text-emerald-400',
        outcome === 'loss' && 'border-red-500/30 text-red-400',
        outcome === 'push' && 'border-yellow-500/30 text-yellow-400',
        outcome === 'pending' && 'border-violet-500/20 text-violet-300'
      )}
      title="Tap: Pending → Win → Loss → Push"
    >
      <span className={cn('mr-0.5 inline-block h-1.5 w-1.5 rounded-full', outcomeDot(outcome))} />
      {outcomeAbbrev(outcome)}
    </button>
  );
}
