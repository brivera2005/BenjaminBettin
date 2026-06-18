'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

interface BetPaginationProps {
  page: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function BetPagination({ page, totalItems, onPageChange }: BetPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  if (totalItems <= PAGE_SIZE) return null;

  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalItems);

  return (
    <div className="flex flex-col items-center gap-3 py-4 sm:flex-row sm:justify-between">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-500">
        Showing {start}–{end} of {totalItems}
      </p>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            'flex flex-1 items-center justify-center gap-1 rounded-xl border px-4 py-3 text-sm font-semibold transition sm:flex-none sm:py-2.5',
            page <= 1
              ? 'border-white/5 text-stone-600'
              : 'border-white/10 text-stone-200 hover:border-violet-500/40 hover:bg-violet-500/10 active:scale-[0.98]'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>
        <span className="shrink-0 px-2 text-sm tabular-nums text-stone-400">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            'flex flex-1 items-center justify-center gap-1 rounded-xl border px-4 py-3 text-sm font-semibold transition sm:flex-none sm:py-2.5',
            page >= totalPages
              ? 'border-white/5 text-stone-600'
              : 'border-white/10 text-stone-200 hover:border-violet-500/40 hover:bg-violet-500/10 active:scale-[0.98]'
          )}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export { PAGE_SIZE };
