'use client';

import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatRunningTotal } from '@/lib/betMath';

interface RunningTotalBannerProps {
  total: number;
  settledCount: number;
  winCount: number;
  lossCount: number;
}

export function RunningTotalBanner({
  total,
  settledCount,
  winCount,
  lossCount,
}: RunningTotalBannerProps) {
  const isPositive = total > 0;
  const isNegative = total < 0;

  return (
    <div
      className={clsx(
        'sticky top-[60px] z-30 border-b backdrop-blur-xl transition-colors sm:top-[73px]',
        isPositive && 'bg-emerald-950/40 border-emerald-500/20',
        isNegative && 'bg-red-950/30 border-red-500/20',
        !isPositive && !isNegative && 'bg-stone-900/60 border-white/5'
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10',
              isPositive && 'bg-emerald-500/20 text-emerald-400',
              isNegative && 'bg-red-500/20 text-red-400',
              !isPositive && !isNegative && 'bg-stone-800 text-stone-500'
            )}
          >
            {isPositive && <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
            {isNegative && <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />}
            {!isPositive && !isNegative && <Minus className="h-4 w-4 sm:h-5 sm:w-5" />}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
              Running Total
            </p>
            <p
              className={clsx(
                'text-2xl font-light tracking-tight tabular-nums sm:text-3xl',
                isPositive && 'text-emerald-400',
                isNegative && 'text-red-400',
                !isPositive && !isNegative && 'text-stone-300'
              )}
            >
              {formatRunningTotal(total)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-6">
          <Stat label="Settled" value={settledCount} valueClass="text-stone-300" />
          <Stat label="Wins" value={winCount} valueClass="text-emerald-400" labelClass="text-emerald-600/80" />
          <Stat label="Losses" value={lossCount} valueClass="text-red-400/90" labelClass="text-red-600/80" />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass,
  labelClass,
}: {
  label: string;
  value: number;
  valueClass: string;
  labelClass?: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-stone-950/40 px-3 py-2 text-center sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-left">
      <p className={clsx('text-[10px] font-bold uppercase tracking-widest text-stone-600', labelClass)}>
        {label}
      </p>
      <p className={clsx('text-sm font-semibold tabular-nums sm:text-base', valueClass)}>{value}</p>
    </div>
  );
}
