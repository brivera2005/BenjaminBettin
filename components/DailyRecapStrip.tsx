'use client';

import { clsx } from 'clsx';
import { useDisplayMode } from '@/components/DisplayModeContext';
import type { DailyRecap } from '@/lib/betStats';

interface DailyRecapStripProps {
  recaps: DailyRecap[];
  className?: string;
}

export function DailyRecapStrip({ recaps, className }: DailyRecapStripProps) {
  return (
    <div className={clsx('flex flex-wrap items-center gap-x-2.5 gap-y-0.5', className)}>
      {recaps.map((recap) => (
        <RecapChip key={recap.label} recap={recap} />
      ))}
    </div>
  );
}

function RecapChip({ recap }: { recap: DailyRecap }) {
  const { formatAmount } = useDisplayMode();
  const { profit, wins, losses, pending, total } = recap;
  const isPositive = profit > 0;
  const isNegative = profit < 0;
  const decided = wins + losses;

  return (
    <div className="flex items-baseline gap-1 text-[9px] leading-none sm:text-[10px]">
      <span className="font-bold uppercase tracking-wide text-stone-600">{recap.label}</span>
      <span
        className={clsx(
          'font-semibold tabular-nums',
          total === 0 && 'text-stone-600',
          total > 0 && isPositive && 'text-emerald-400/90',
          total > 0 && isNegative && 'text-red-400/90',
          total > 0 && !isPositive && !isNegative && 'text-stone-400'
        )}
      >
        {total === 0 ? '—' : formatAmount(profit)}
      </span>
      {total > 0 && (
        <span className="tabular-nums text-stone-600">
          {decided > 0 && (
            <>
              {wins}-{losses}
              {pending > 0 && `·${pending}p`}
            </>
          )}
          {decided === 0 && pending > 0 && `${pending}p`}
        </span>
      )}
    </div>
  );
}
