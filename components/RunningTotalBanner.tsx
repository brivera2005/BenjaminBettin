'use client';

import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DailyRecapStrip } from '@/components/DailyRecapStrip';
import { useDisplayMode } from '@/components/DisplayModeContext';
import type { DailyRecap } from '@/lib/betStats';

interface RunningTotalBannerProps {
  total: number;
  settledCount: number;
  winCount: number;
  lossCount: number;
  winRate: number | null;
  dailyRecaps: DailyRecap[];
}

export function RunningTotalBanner({
  total,
  settledCount,
  winCount,
  lossCount,
  winRate,
  dailyRecaps,
}: RunningTotalBannerProps) {
  const { formatTotal, toggleUnits, units } = useDisplayMode();
  const isPositive = total > 0;
  const isNegative = total < 0;

  return (
    <div
      className={clsx(
        'sticky top-[72px] z-30 border-b backdrop-blur-xl transition-colors',
        isPositive && 'bg-emerald-950/40 border-emerald-500/20',
        isNegative && 'bg-red-950/30 border-red-500/20',
        !isPositive && !isNegative && 'bg-surface-strong border-border-subtle'
      )}
    >
      <div className="mx-auto max-w-6xl px-3 py-1.5 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <div className="flex items-center gap-1.5">
            <div
              className={clsx(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
                isPositive && 'bg-emerald-500/20 text-emerald-400',
                isNegative && 'bg-red-500/20 text-red-400',
                !isPositive && !isNegative && 'bg-surface-strong text-muted-foreground'
              )}
            >
              {isPositive && <TrendingUp className="h-3 w-3" />}
              {isNegative && <TrendingDown className="h-3 w-3" />}
              {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                Total
              </span>
              <button
                type="button"
                onClick={toggleUnits}
                title={units ? 'Show dollars' : 'Show units ($10 per unit)'}
                className={clsx(
                  'rounded px-0.5 text-base font-semibold tabular-nums leading-none transition hover:opacity-80 active:scale-[0.98] sm:text-lg',
                  isPositive && 'text-emerald-400',
                  isNegative && 'text-red-400',
                  !isPositive && !isNegative && 'text-heading'
                )}
              >
                {formatTotal(total)}
              </button>
            </div>
          </div>

          <span className="hidden h-3 w-px bg-divider sm:block" />

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] tabular-nums sm:text-[10px]">
            <Stat value={settledCount} label="settled" />
            <Stat value={winCount} label="W" valueClass="text-emerald-400/90" />
            <Stat value={lossCount} label="L" valueClass="text-red-400/90" />
            <Stat
              value={winRate !== null ? `${winRate}%` : '—'}
              label="win"
              valueClass="text-violet-300/90"
            />
          </div>

          <span className="hidden h-3 w-px bg-divider md:block" />

          <DailyRecapStrip recaps={dailyRecaps} className="md:ml-0" />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass = 'text-muted-foreground',
}: {
  label: string;
  value: number | string;
  valueClass?: string;
}) {
  return (
    <span className="text-muted-foreground">
      <span className={clsx('font-semibold', valueClass)}>{value}</span> {label}
    </span>
  );
}
