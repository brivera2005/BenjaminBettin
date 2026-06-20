'use client';

import { Hand, Pencil } from 'lucide-react';
import { calculateBetResult, formatAmericanOddsDisplay } from '@/lib/betMath';
import { useDisplayMode } from '@/components/DisplayModeContext';
import { needsManualGrading } from '@/lib/betParse';
import {
  OutcomePill,
  cycleOutcome,
  outcomePlClass,
  betRowBetClass,
  betRowDateWidth,
  betRowLayoutClass,
  betRowEditWidth,
  betRowOddsWidth,
  betRowPlWidth,
  betRowWagerOddsClass,
  betRowWagerWidth,
} from '@/components/betRowShared';
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
        'group border-b',
        betRowLayoutClass,
        manual
          ? 'border-b-yellow-500/20 bg-yellow-500/[0.07] ring-1 ring-inset ring-yellow-500/35'
          : 'border-border-subtle'
      )}
      title={manual ? reason ?? 'Grade manually' : undefined}
    >
      {manual && (
        <Hand
          className="h-3 w-3 shrink-0 text-yellow-500/90"
          aria-label="Manual grade required"
        />
      )}

      <span className={cn(betRowDateWidth, 'tabular-nums text-muted-foreground')}>
        {formatShortDate(bet.bet_date)}
      </span>

      <span
        className={cn(
          betRowBetClass,
          'font-medium',
          manual ? 'text-yellow-800' : 'text-heading'
        )}
        title={bet.bet || 'No description'}
      >
        {bet.bet || <span className="text-muted-foreground italic">untitled</span>}
      </span>

      <span className={cn(betRowWagerWidth, betRowWagerOddsClass)}>
        {formatWager(bet.wager)}
      </span>
      <span className={cn(betRowOddsWidth, betRowWagerOddsClass, 'text-right')}>
        {formatAmericanOddsDisplay(bet.odds)}
      </span>

      <OutcomePill
        outcome={bet.outcome}
        onClick={() => onOutcomeChange(bet.id, cycleOutcome(bet.outcome))}
      />

      <span
        className={cn(
          betRowPlWidth,
          'text-right tabular-nums font-semibold',
          outcomePlClass(bet.outcome)
        )}
      >
        {bet.outcome === 'pending' ? '—' : formatAmount(result)}
      </span>

      <button
        type="button"
        onClick={() => onEdit(bet.id)}
        className={cn(
          betRowEditWidth,
          'flex h-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-hover hover:text-violet-400 sm:opacity-70 sm:group-hover:opacity-100'
        )}
        aria-label="Edit bet"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  );
}
