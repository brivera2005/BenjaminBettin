'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayPaginationProps {
  label: string;
  page: number;
  totalDays: number;
  betCount: number;
  isToday?: boolean;
  onPageChange: (page: number) => void;
  onJumpToToday?: () => void;
}

export function DayPagination({
  label,
  page,
  totalDays,
  betCount,
  isToday,
  onPageChange,
  onJumpToToday,
}: DayPaginationProps) {
  return (
    <div className="mb-2 space-y-1.5">
      <div className="flex items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalDays - 1}
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition',
            page >= totalDays - 1
              ? 'border-border-subtle text-muted-foreground/50'
              : 'border-border-default text-muted-foreground hover:border-violet-500/40 active:scale-95'
          )}
          aria-label="Previous day"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-xs font-semibold text-heading">{label}</p>
          <p className="text-[9px] text-muted-foreground">
            {betCount} bet{betCount !== 1 ? 's' : ''}
            {totalDays > 1 && ` · ${page + 1}/${totalDays}`}
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
          aria-label="Next day"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {!isToday && onJumpToToday && (
        <button
          type="button"
          onClick={onJumpToToday}
          className="w-full rounded-md border border-violet-500/20 bg-violet-500/10 py-1 text-[9px] font-bold uppercase tracking-widest text-violet-300 transition hover:bg-violet-500/20 active:scale-[0.99]"
        >
          Jump to today
        </button>
      )}
    </div>
  );
}
