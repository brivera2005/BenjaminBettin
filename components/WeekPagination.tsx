'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { WeekRange } from '@/lib/weekUtils';
import { cn } from '@/lib/utils';

interface WeekPaginationProps {
  week: WeekRange;
  page: number;
  totalWeeks: number;
  betCount: number;
  isCurrentWeek?: boolean;
  onPageChange: (page: number) => void;
  onJumpToToday?: () => void;
}

export function WeekPagination({
  week,
  page,
  totalWeeks,
  betCount,
  isCurrentWeek,
  onPageChange,
  onJumpToToday,
}: WeekPaginationProps) {
  return (
    <div className="mb-2 space-y-1.5">
      <div className="flex items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalWeeks - 1}
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition',
            page >= totalWeeks - 1
              ? 'border-white/5 text-stone-700'
              : 'border-white/10 text-stone-400 hover:border-violet-500/40 active:scale-95'
          )}
          aria-label="Older week"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-xs font-semibold text-stone-200">{week.label}</p>
          <p className="text-[9px] text-stone-600">
            {betCount} bet{betCount !== 1 ? 's' : ''}
            {totalWeeks > 1 && ` · ${page + 1}/${totalWeeks}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition',
            page <= 0
              ? 'border-white/5 text-stone-700'
              : 'border-white/10 text-stone-400 hover:border-violet-500/40 active:scale-95'
          )}
          aria-label="Newer week"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {!isCurrentWeek && onJumpToToday && (
        <button
          type="button"
          onClick={onJumpToToday}
          className="w-full rounded-md border border-violet-500/20 bg-violet-500/10 py-1 text-[9px] font-bold uppercase tracking-widest text-violet-300 transition hover:bg-violet-500/20 active:scale-[0.99]"
        >
          Jump to this week
        </button>
      )}
    </div>
  );
}
