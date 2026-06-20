'use client';

import { Hand, Pencil } from 'lucide-react';
import { calculateBetResult } from '@/lib/betMath';
import { useDisplayMode } from '@/components/DisplayModeContext';
import { needsManualGrading } from '@/lib/betParse';
import { OutcomePill, cycleOutcome, outcomePlClass } from '@/components/betRowShared';
import type { Bet, BetOutcome } from '@/lib/types';
import { formatShortDate } from '@/lib/weekUtils';
import { cn } from '@/lib/utils';

interface BetCompactRowProps {
  bet: Bet;
  autoGradeMissed?: boolean;
  onOutcomeChange: (id: string, outcome: BetOutcome) => void;
  onEdit: (id: string) => void;
}

export function BetCompactRow({
  bet,
  autoGradeMissed = false,
  onOutcomeChange,
  onEdit,
}: BetCompactRowProps) {
  const { formatAmount, formatWager } = useDisplayMode();
  const result = calculateBetResult(bet.wager, bet.odds, bet.outcome);
  const { manual, reason } = needsManualGrading(bet, autoGradeMissed);

  return (
    <div
      className={cn(
        'group flex items-center gap-1 border-b px-1 py-1.5 text-[11px] leading-tight sm:gap-1.5 sm:px-2 sm:text-xs',
        manual
          ? 'border-b-yellow-500/20 bg-yellow-500/[0.07] ring-1 ring-inset ring-yellow-500/35'
          : 'border-white/5'
      )}
      title={manual ? reason ?? 'Grade manually' : undefined}
    >
      {manual && (
        <Hand
          className="h-3 w-3 shrink-0 text-yellow-500/90"
          aria-label="Manual grade required"
        />
      )}

      <span className="w-8 shrink-0 tabular-nums text-stone-500 sm:w-9">
        {formatShortDate(bet.bet_date)}
      </span>

      <span
        className={cn(
          'min-w-0 flex-1 truncate font-medium',
          manual ? 'text-yellow-100' : 'text-stone-200'
        )}
        title={bet.bet || 'No description'}
      >
        {bet.bet || <span className="text-stone-600 italic">untitled</span>}
      </span>

      <span className="w-9 shrink-0 tabular-nums text-stone-500 sm:w-11">
        {formatWager(bet.wager)}
      </span>
      <span className="w-10 shrink-0 text-right tabular-nums text-emerald-500/90 sm:w-11">
        {bet.odds}
      </span>

      <OutcomePill
        outcome={bet.outcome}
        onClick={() => onOutcomeChange(bet.id, cycleOutcome(bet.outcome))}
      />

      <span
        className={cn(
          'w-11 shrink-0 text-right tabular-nums font-semibold sm:w-12',
          outcomePlClass(bet.outcome)
        )}
      >
        {bet.outcome === 'pending' ? '—' : formatAmount(result)}
      </span>

      <button
        type="button"
        onClick={() => onEdit(bet.id)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-stone-600 transition hover:bg-white/5 hover:text-violet-400 sm:opacity-70 sm:group-hover:opacity-100"
        aria-label="Edit bet"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  );
}
