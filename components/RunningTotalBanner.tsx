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
        'sticky top-[73px] z-40 -mx-6 px-6 py-4 border-b backdrop-blur-xl transition-colors',
        isPositive && 'bg-emerald-950/40 border-emerald-500/20',
        isNegative && 'bg-red-950/30 border-red-500/20',
        !isPositive && !isNegative && 'bg-stone-900/60 border-white/5'
      )}
    >
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              isPositive && 'bg-emerald-500/20 text-emerald-400',
              isNegative && 'bg-red-500/20 text-red-400',
              !isPositive && !isNegative && 'bg-stone-800 text-stone-500'
            )}
          >
            {isPositive && <TrendingUp className="w-5 h-5" />}
            {isNegative && <TrendingDown className="w-5 h-5" />}
            {!isPositive && !isNegative && <Minus className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
              Running Total
            </p>
            <p
              className={clsx(
                'text-3xl font-light tracking-tight tabular-nums',
                isPositive && 'text-emerald-400',
                isNegative && 'text-red-400',
                !isPositive && !isNegative && 'text-stone-300'
              )}
            >
              {formatRunningTotal(total)}
            </p>
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-600 font-bold">
              Settled
            </p>
            <p className="text-stone-300 font-semibold tabular-nums">{settledCount}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-emerald-600/80 font-bold">
              Wins
            </p>
            <p className="text-emerald-400 font-semibold tabular-nums">{winCount}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-red-600/80 font-bold">
              Losses
            </p>
            <p className="text-red-400/90 font-semibold tabular-nums">{lossCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
