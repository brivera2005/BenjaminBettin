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
      return 'text-emerald-600 dark:text-emerald-400';
    case 'loss':
      return 'text-red-600 dark:text-red-400';
    case 'push':
      return 'text-yellow-600 dark:text-yellow-400';
    default:
      return 'text-muted-foreground';
  }
}

export function profitValueClass(value: number): string {
  if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (value < 0) return 'text-red-600 dark:text-red-400';
  return 'text-muted-foreground';
}

export const betRowWagerOddsClass = 'tabular-nums text-foreground';

export const betRowLayoutClass =
  'flex items-center gap-1 px-1 py-1 text-[11px] leading-tight sm:gap-1.5 sm:px-2 sm:text-xs';

export const betRowBetClass = 'min-w-0 flex-1 truncate text-right';
export const betRowBetInputClass = 'min-w-0 flex-1 text-right font-medium';

export const betRowDateWidth = 'w-8 shrink-0 sm:w-9';
export const betRowWagerWidth = 'w-9 shrink-0 sm:w-11';
export const betRowOddsWidth = 'w-10 shrink-0 sm:w-11';
export const betRowStatusWidth = 'w-6 shrink-0';
export const betRowPlWidth = 'w-11 shrink-0 sm:w-12';
export const betRowEditWidth = 'w-6 shrink-0';

export function BetRowPlSpacers() {
  return (
    <>
      <span className={betRowWagerWidth} aria-hidden />
      <span className={betRowOddsWidth} aria-hidden />
      <span className={betRowStatusWidth} aria-hidden />
    </>
  );
}

export const compactInputClass =
  'min-w-0 rounded border border-border-default bg-surface-input px-1 py-0.5 text-[11px] text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/40 sm:px-1.5 sm:text-xs';

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
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border-default text-[10px] font-bold transition active:scale-95',
        outcome === 'win' &&
          'border-emerald-500/40 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400',
        outcome === 'loss' &&
          'border-red-500/40 text-red-700 dark:border-red-500/30 dark:text-red-400',
        outcome === 'push' &&
          'border-yellow-500/40 text-yellow-700 dark:border-yellow-500/30 dark:text-yellow-400',
        outcome === 'pending' &&
          'border-violet-500/30 text-violet-700 dark:border-violet-500/20 dark:text-violet-300'
      )}
      title="Tap: Pending → Win → Loss → Push"
    >
      <span className={cn('mr-0.5 inline-block h-1.5 w-1.5 rounded-full', outcomeDot(outcome))} />
      {outcomeAbbrev(outcome)}
    </button>
  );
}
