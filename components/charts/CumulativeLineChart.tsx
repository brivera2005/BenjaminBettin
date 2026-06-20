'use client';

import type { CumulativePoint } from '@/lib/betStats';
import { useDisplayMode } from '@/components/DisplayModeContext';

interface CumulativeLineChartProps {
  points: CumulativePoint[];
}

export function CumulativeLineChart({ points }: CumulativeLineChartProps) {
  const { formatAmount } = useDisplayMode();
  if (points.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-stone-600">Chart builds as you settle bets.</p>
    );
  }

  const width = Math.max(points.length * 12, 280);
  const height = 140;
  const padX = 12;
  const padY = 16;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const values = points.map((p) => p.cumulative);
  const minV = Math.min(0, ...values);
  const maxV = Math.max(0, ...values);
  const range = maxV - minV || 1;

  const toX = (i: number) => padX + (i / Math.max(points.length - 1, 1)) * chartW;
  const toY = (v: number) => padY + chartH - ((v - minV) / range) * chartH;

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.cumulative)}`)
    .join(' ');

  const zeroY = toY(0);
  const last = points[points.length - 1];
  const positive = last.cumulative >= 0;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto min-w-full"
        role="img"
        aria-label="Cumulative profit over time"
      >
        <line
          x1={padX}
          y1={zeroY}
          x2={width - padX}
          y2={zeroY}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <path
          d={linePath}
          fill="none"
          stroke={positive ? 'rgb(52, 211, 153)' : 'rgb(248, 113, 113)'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.length <= 24 &&
          points.map((p, i) => (
            <circle
              key={`${p.date}-${i}`}
              cx={toX(i)}
              cy={toY(p.cumulative)}
              r="2.5"
              className={p.cumulative >= 0 ? 'fill-emerald-400' : 'fill-red-400'}
            >
              <title>
                {p.label}: {formatAmount(p.cumulative)}
              </title>
            </circle>
          ))}
        <text
          x={width - padX}
          y={padY - 2}
          textAnchor="end"
          className={positive ? 'fill-emerald-400' : 'fill-red-400'}
          fontSize="10"
          fontWeight="600"
        >
          {formatAmount(last.cumulative)}
        </text>
      </svg>
    </div>
  );
}
