'use client';

import { type MonthSummary } from '@/lib/betMath';
import { isPriorPeriodKey } from '@/lib/baseline';
import { useDisplayMode } from '@/components/DisplayModeContext';
import { cn } from '@/lib/utils';

interface MonthlyBarChartProps {
  months: MonthSummary[];
  selectedKey?: string;
  onSelect?: (key: string) => void;
}

export function MonthlyBarChart({ months, selectedKey, onSelect }: MonthlyBarChartProps) {
  const { formatAmount } = useDisplayMode();
  if (months.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-stone-600">No settled bets to chart yet.</p>
    );
  }

  const maxAbs = Math.max(...months.map((m) => Math.abs(m.profit)), 1);
  const width = Math.max(months.length * 48, 280);
  const height = 160;
  const padX = 8;
  const padY = 24;
  const barGap = 8;
  const barWidth = (width - padX * 2 - barGap * (months.length - 1)) / months.length;
  const chartH = height - padY * 2;
  const zeroY = padY + chartH / 2;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto min-w-full"
        role="img"
        aria-label="Monthly profit and loss bar chart"
      >
        <line
          x1={padX}
          y1={zeroY}
          x2={width - padX}
          y2={zeroY}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
        {months.map((month, i) => {
          const x = padX + i * (barWidth + barGap);
          const barH = (Math.abs(month.profit) / maxAbs) * (chartH / 2 - 4);
          const positive = month.profit >= 0;
          const y = positive ? zeroY - barH : zeroY;
          const isSelected = month.key === selectedKey;
          const shortLabel = isPriorPeriodKey(month.key)
            ? month.key === 'prior-june'
              ? 'Jun†'
              : 'Prior'
            : month.label.split(' ')[0].slice(0, 3);

          return (
            <g
              key={month.key}
              className={cn(onSelect && 'cursor-pointer')}
              onClick={() => {
                if (!isPriorPeriodKey(month.key)) onSelect?.(month.key);
              }}
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, month.profit === 0 ? 2 : 0)}
                rx={3}
                className={cn(
                  'transition-opacity',
                  positive ? 'fill-emerald-500/80' : 'fill-red-500/70',
                  isSelected && 'stroke-violet-400 stroke-2',
                  onSelect && 'hover:opacity-80'
                )}
              />
              <text
                x={x + barWidth / 2}
                y={height - 6}
                textAnchor="middle"
                className="fill-stone-500 text-[9px] font-semibold"
              >
                {shortLabel}
              </text>
              <title>
                {month.label}: {formatAmount(month.profit)} ({month.totalBets} bets)
              </title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
