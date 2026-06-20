'use client';

import { useDisplayMode } from '@/components/DisplayModeContext';
import { betRowPlWidth, profitValueClass } from '@/components/betRowShared';
import type { DailyProfitEntry } from '@/lib/betStats';
import { cn } from '@/lib/utils';

interface BetDayPlCellProps {
  entry: DailyProfitEntry | undefined;
  className?: string;
}

export function BetDayPlCell({ entry, className }: BetDayPlCellProps) {
  const { formatTotal } = useDisplayMode();
  const hasSettled = entry?.hasSettled ?? false;
  const profit = entry?.profit ?? 0;

  return (
    <span
      className={cn(
        betRowPlWidth,
        'text-right text-[10px] font-semibold tabular-nums sm:text-[11px]',
        hasSettled ? profitValueClass(profit) : 'text-stone-600',
        className
      )}
      title="Day running total"
    >
      {hasSettled ? formatTotal(profit) : '—'}
    </span>
  );
}
