'use client';

import { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { isPriorPeriodKey } from '@/lib/baseline';
import { useDisplayMode } from '@/components/DisplayModeContext';
import { type MonthSummary } from '@/lib/betMath';
import { cn } from '@/lib/utils';

interface MonthlySummaryProps {
  summaries: MonthSummary[];
  onMonthClick?: (monthKey: string) => void;
}

export function MonthlySummary({ summaries, onMonthClick }: MonthlySummaryProps) {
  const { formatAmount } = useDisplayMode();
  const [expanded, setExpanded] = useState(true);

  if (summaries.length === 0) return null;

  return (
    <section className="mb-5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mb-3 flex w-full items-center justify-between gap-2 rounded-xl border border-white/5 bg-stone-900/40 px-4 py-3 text-left transition hover:border-violet-500/20"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-bold tracking-tight text-stone-200">
            Monthly Summary
          </span>
          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-violet-300">
            {summaries.length} {summaries.length === 1 ? 'month' : 'months'}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-stone-500" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-stone-500" />
        )}
      </button>

      {expanded && (
        <div className="space-y-2">
          {summaries.map((month) => {
            const settled = month.wins + month.losses + month.pushes;
            const winRate =
              month.wins + month.losses > 0
                ? Math.round((month.wins / (month.wins + month.losses)) * 100)
                : null;

            return (
              <article
                key={month.key}
                role={onMonthClick && !isPriorPeriodKey(month.key) ? 'button' : undefined}
                tabIndex={onMonthClick && !isPriorPeriodKey(month.key) ? 0 : undefined}
                onClick={
                  onMonthClick && !isPriorPeriodKey(month.key)
                    ? () => onMonthClick(month.key)
                    : undefined
                }
                onKeyDown={
                  onMonthClick && !isPriorPeriodKey(month.key)
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onMonthClick(month.key);
                        }
                      }
                    : undefined
                }
                className={cn(
                  'rounded-2xl border border-white/5 bg-stone-900/30 p-4',
                  onMonthClick &&
                    !isPriorPeriodKey(month.key) &&
                    'cursor-pointer transition hover:border-violet-500/30 hover:bg-stone-900/50 active:scale-[0.99]'
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-stone-100">{month.label}</h3>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-600">
                      {month.totalBets} bet{month.totalBets !== 1 ? 's' : ''}
                      {month.pending > 0 && ` · ${month.pending} pending`}
                    </p>
                  </div>
                  <p
                    className={cn(
                      'text-xl font-light tabular-nums',
                      month.profit > 0 && 'text-emerald-400',
                      month.profit < 0 && 'text-red-400/90',
                      month.profit === 0 && 'text-stone-400'
                    )}
                  >
                    {formatAmount(month.profit)}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <MiniStat label="Wins" value={month.wins} className="text-emerald-400" />
                  <MiniStat label="Losses" value={month.losses} className="text-red-400" />
                  <MiniStat label="Push" value={month.pushes} className="text-yellow-400" />
                  <MiniStat
                    label="Win %"
                    value={winRate !== null ? `${winRate}%` : '—'}
                    className="text-stone-300"
                  />
                </div>
                {settled > 0 && (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-800">
                    <div
                      className="h-full rounded-full bg-emerald-500/70 transition-all"
                      style={{ width: `${winRate ?? 0}%` }}
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function MiniStat({
  label,
  value,
  className,
}: {
  label: string;
  value: number | string;
  className?: string;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-stone-950/40 px-2 py-2 text-center">
      <p className="text-[9px] font-bold uppercase tracking-widest text-stone-600">{label}</p>
      <p className={cn('text-sm font-semibold tabular-nums', className)}>{value}</p>
    </div>
  );
}
