'use client';

import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useDisplayMode } from '@/components/DisplayModeContext';
import { MonthlySummary } from '@/components/MonthlySummary';
import { CumulativeLineChart } from '@/components/charts/CumulativeLineChart';
import { MonthlyBarChart } from '@/components/charts/MonthlyBarChart';
import type { MonthSummary } from '@/lib/betMath';
import {
  computeCumulativeSeries,
  computeOverallStats,
  monthSummariesChronological,
} from '@/lib/betStats';
import type { Bet } from '@/lib/types';
import { cn } from '@/lib/utils';

interface HistoryViewProps {
  bets: Bet[];
  monthSummaries: MonthSummary[];
  onJumpToMonth: (monthKey: string) => void;
}

export function HistoryView({ bets, monthSummaries, onJumpToMonth }: HistoryViewProps) {
  const { formatAmount, formatWager } = useDisplayMode();
  const stats = useMemo(() => computeOverallStats(bets), [bets]);
  const cumulative = useMemo(() => computeCumulativeSeries(bets), [bets]);
  const chartMonths = useMemo(() => monthSummariesChronological(bets), [bets]);

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatCard
          label="All-time P/L"
          value={formatAmount(stats.profit)}
          valueClass={cn(
            stats.profit > 0 && 'text-emerald-400',
            stats.profit < 0 && 'text-red-400',
            stats.profit === 0 && 'text-stone-400'
          )}
        />
        <StatCard
          label="Win rate"
          value={stats.winRate !== null ? `${stats.winRate}%` : '—'}
          sub={stats.settled > 0 ? `${stats.wins}W · ${stats.losses}L` : 'in-app bets only'}
        />
        <StatCard
          label="ROI"
          value={stats.roi !== null ? `${stats.roi > 0 ? '+' : ''}${stats.roi}%` : '—'}
          sub="in-app settled"
        />
        <StatCard
          label="Avg wager"
          value={stats.totalBets > 0 ? formatWager(stats.avgWager) : '—'}
          sub={`${stats.totalBets} logged`}
        />
      </section>

      <ChartCard title="Cumulative P/L" subtitle="Jan–May prior + settled bets">
        <CumulativeLineChart points={cumulative} />
      </ChartCard>

      <ChartCard title="Monthly P/L" subtitle="Tap a month to jump to Bets">
        <MonthlyBarChart
          months={chartMonths}
          onSelect={(key) => onJumpToMonth(key)}
        />
      </ChartCard>

      <MonthlySummary summaries={monthSummaries} onMonthClick={onJumpToMonth} />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface px-3 py-3">
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-lg font-semibold tabular-nums text-heading', valueClass)}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-surface p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-heading">{title}</h2>
          {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      </div>
      {children}
    </section>
  );
}
