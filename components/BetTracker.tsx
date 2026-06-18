'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Plus, Trash2, Zap } from 'lucide-react';
import { AuthButton } from '@/components/AuthButton';
import { BetPagination, PAGE_SIZE } from '@/components/BetPagination';
import { MonthlySummary } from '@/components/MonthlySummary';
import { RunningTotalBanner } from '@/components/RunningTotalBanner';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/components/AuthProvider';
import {
  calculateBetResult,
  calculateRunningTotal,
  computeMonthSummaries,
  formatCurrency,
} from '@/lib/betMath';
import type { Bet, BetInput, BetOutcome } from '@/lib/types';
import { cn } from '@/lib/utils';

const OUTCOMES: { value: BetOutcome; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'win', label: 'Win' },
  { value: 'loss', label: 'Loss' },
  { value: 'push', label: 'Push' },
];

function outcomeStyles(outcome: BetOutcome) {
  switch (outcome) {
    case 'win':
      return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'loss':
      return 'text-stone-400 bg-stone-500/10 border-stone-500/20';
    case 'push':
      return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    default:
      return 'text-violet-300 bg-violet-500/10 border-violet-500/20';
  }
}

function resultStyles(result: number, outcome: BetOutcome) {
  if (outcome === 'pending') return 'text-stone-500';
  if (result > 0) return 'text-emerald-400';
  if (result < 0) return 'text-stone-400';
  return 'text-amber-400';
}

export default function BetTracker() {
  const { user, loading: authLoading } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loadingBets, setLoadingBets] = useState(false);
  const [page, setPage] = useState(1);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const loadBets = useCallback(async () => {
    setLoadingBets(true);
    try {
      const response = await fetch('/api/bets', { cache: 'no-store' });
      if (!response.ok) return;
      const data = (await response.json()) as { bets: Bet[] };
      setBets(data.bets);
    } finally {
      setLoadingBets(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setBets([]);
      return;
    }
    loadBets();
  }, [user, loadBets]);

  useEffect(() => {
    const timers = saveTimers.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  const runningTotal = useMemo(() => calculateRunningTotal(bets), [bets]);
  const settledCount = useMemo(
    () => bets.filter((bet) => bet.outcome !== 'pending').length,
    [bets]
  );
  const winCount = useMemo(
    () => bets.filter((bet) => bet.outcome === 'win').length,
    [bets]
  );
  const lossCount = useMemo(
    () => bets.filter((bet) => bet.outcome === 'loss').length,
    [bets]
  );
  const monthSummaries = useMemo(() => computeMonthSummaries(bets), [bets]);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(bets.length / PAGE_SIZE)),
    [bets.length]
  );
  const paginatedBets = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return bets.slice(start, start + PAGE_SIZE);
  }, [bets, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const persistUpdate = useCallback((id: string, patch: BetInput) => {
    const existing = saveTimers.current.get(id);
    if (existing) clearTimeout(existing);

    saveTimers.current.set(
      id,
      setTimeout(async () => {
        saveTimers.current.delete(id);
        await fetch(`/api/bets/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
      }, 350)
    );
  }, []);

  const updateBet = useCallback(
    (id: string, patch: BetInput) => {
      setBets((current) =>
        current.map((bet) =>
          bet.id === id
            ? {
                ...bet,
                ...patch,
                updated_at: new Date().toISOString(),
              }
            : bet
        )
      );
      persistUpdate(id, patch);
    },
    [persistUpdate]
  );

  const addBet = useCallback(async () => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const optimistic: Bet = {
      id: tempId,
      user_id: user?.id ?? '',
      bet_date: now.slice(0, 10),
      bet: '',
      wager: 0,
      odds: '-110',
      outcome: 'pending',
      created_at: now,
      updated_at: now,
    };

    setBets((current) => [optimistic, ...current]);
    setPage(1);

    const response = await fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bet_date: optimistic.bet_date,
        bet: optimistic.bet,
        wager: optimistic.wager,
        odds: optimistic.odds,
        outcome: optimistic.outcome,
      }),
    });

    if (!response.ok) {
      setBets((current) => current.filter((bet) => bet.id !== tempId));
      return;
    }

    const data = (await response.json()) as { bet: Bet };
    setBets((current) =>
      current.map((bet) => (bet.id === tempId ? data.bet : bet))
    );
  }, [user?.id]);

  const removeBet = useCallback(async (id: string) => {
    const previous = bets;
    setBets((current) => current.filter((bet) => bet.id !== id));

    const timer = saveTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      saveTimers.current.delete(id);
    }

    const response = await fetch(`/api/bets/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      setBets(previous);
    }
  }, [bets]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#050505] text-stone-100">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-violet-900/20 blur-[140px]" />
        </div>
        <header className="sticky top-0 z-40 border-b border-white/5 bg-[#050505]/80 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <BrandMark />
            <AuthButton />
          </div>
        </header>
        <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <SignInPrompt />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050505] text-stone-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-violet-900/20 blur-[140px]" />
        <div className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-emerald-900/10 blur-[140px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#050505]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
          <BrandMark />
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={addBet}
              className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-violet-900/30 transition hover:bg-violet-500 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-[11px]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="sm:hidden">Add</span>
              <span className="hidden sm:inline">Add Bet</span>
            </button>
            <AuthButton />
          </div>
        </div>
      </header>

      <RunningTotalBanner
        total={runningTotal}
        settledCount={settledCount}
        winCount={winCount}
        lossCount={lossCount}
      />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-8">
        {loadingBets && bets.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          </div>
        ) : bets.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-stone-900/20 px-6 py-20 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-stone-500">
              No bets logged yet
            </p>
            <p className="mt-2 text-stone-600">
              Tap &quot;Add Bet&quot; to start tracking your action.
            </p>
            <button
              type="button"
              onClick={addBet}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-stone-300 transition hover:border-violet-500/40 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add your first bet
            </button>
          </div>
        ) : (
          <>
            <MonthlySummary summaries={monthSummaries} />

            <BetPagination
              page={page}
              totalItems={bets.length}
              onPageChange={setPage}
            />

            {/* Mobile: stacked cards — no horizontal scroll */}
            <div className="space-y-3 md:hidden">
              {paginatedBets.map((bet, index) => (
                <BetMobileCard
                  key={bet.id}
                  bet={bet}
                  isNewest={page === 1 && index === 0}
                  onUpdate={updateBet}
                  onRemove={removeBet}
                />
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-hidden rounded-3xl border border-white/5 bg-stone-900/30 shadow-2xl shadow-black/40 md:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-stone-900/60 text-left">
                    {['Date', 'Bet', 'Wager', 'Odds', 'Outcome', 'Result', ''].map(
                      (label) => (
                        <th
                          key={label || 'actions'}
                          className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500"
                        >
                          {label}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedBets.map((bet, index) => (
                    <BetTableRow
                      key={bet.id}
                      bet={bet}
                      isNewest={page === 1 && index === 0}
                      onUpdate={updateBet}
                      onRemove={removeBet}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <BetPagination
              page={page}
              totalItems={bets.length}
              onPageChange={setPage}
            />
          </>
        )}
      </main>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-600 to-violet-950 shadow-lg shadow-violet-900/20 sm:h-10 sm:w-10">
        <Zap className="h-4 w-4 text-white sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0">
        <h1 className="truncate text-lg font-black uppercase italic tracking-tighter sm:text-2xl">
          Benjamin<span className="text-violet-500">Bettin&apos;</span>
        </h1>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-500 sm:text-[10px]">
          Bet Tracker
        </p>
      </div>
    </div>
  );
}

interface BetRowProps {
  bet: Bet;
  isNewest: boolean;
  onUpdate: (id: string, patch: BetInput) => void;
  onRemove: (id: string) => void;
}

function BetMobileCard({ bet, isNewest, onUpdate, onRemove }: BetRowProps) {
  const result = calculateBetResult(bet.wager, bet.odds, bet.outcome);

  return (
    <article
      className={cn(
        'w-full rounded-2xl border border-white/5 bg-stone-900/40 p-4',
        isNewest && 'border-violet-500/20 bg-violet-500/[0.04]'
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <input
          type="date"
          value={bet.bet_date}
          onChange={(e) => onUpdate(bet.id, { bet_date: e.target.value })}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-stone-950/60 px-2 py-2 text-sm text-stone-200 outline-none focus:border-violet-500/40"
        />
        <button
          type="button"
          onClick={() => onRemove(bet.id)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-stone-500 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
          aria-label="Delete bet"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <label className="mb-3 block">
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-stone-600">
          Bet
        </span>
        <input
          type="text"
          value={bet.bet}
          placeholder="Yankees -1.5"
          onChange={(e) => onUpdate(bet.id, { bet: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-stone-950/60 px-3 py-3 text-base font-medium text-stone-100 outline-none placeholder:text-stone-600 focus:border-violet-500/40"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Wager">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={bet.wager || ''}
              placeholder="0"
              onChange={(e) =>
                onUpdate(bet.id, { wager: Number.parseFloat(e.target.value) || 0 })
              }
              className="w-full rounded-xl border border-white/10 bg-stone-950/60 py-2.5 pl-7 pr-3 text-sm tabular-nums text-stone-200 outline-none focus:border-violet-500/40"
            />
          </div>
        </Field>

        <Field label="Odds">
          <input
            type="text"
            value={bet.odds}
            placeholder="-110"
            onChange={(e) => onUpdate(bet.id, { odds: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-stone-950/60 px-3 py-2.5 text-sm font-semibold tabular-nums text-emerald-400 outline-none focus:border-violet-500/40"
          />
        </Field>

        <Field label="Outcome">
          <div className="relative">
            <select
              value={bet.outcome}
              onChange={(e) =>
                onUpdate(bet.id, { outcome: e.target.value as BetOutcome })
              }
              className={cn(
                'w-full appearance-none rounded-xl border px-3 py-2.5 pr-8 text-sm font-semibold outline-none',
                outcomeStyles(bet.outcome)
              )}
            >
              {OUTCOMES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
          </div>
        </Field>

        <Field label="Result">
          <div
            className={cn(
              'flex h-[42px] items-center rounded-xl border border-white/10 bg-stone-950/40 px-3 text-sm font-semibold tabular-nums',
              resultStyles(result, bet.outcome)
            )}
          >
            {bet.outcome === 'pending' ? '—' : formatCurrency(result)}
          </div>
        </Field>
      </div>
    </article>
  );
}

function BetTableRow({ bet, isNewest, onUpdate, onRemove }: BetRowProps) {
  const result = calculateBetResult(bet.wager, bet.odds, bet.outcome);

  return (
    <tr
      className={cn(
        'group border-b border-white/5 transition-colors hover:bg-white/[0.02]',
        isNewest && 'bg-violet-500/[0.03]'
      )}
    >
      <td className="px-2 py-2">
        <input
          type="date"
          value={bet.bet_date}
          onChange={(e) => onUpdate(bet.id, { bet_date: e.target.value })}
          className="w-full rounded-xl border border-transparent bg-transparent px-3 py-2.5 text-sm text-stone-200 outline-none transition focus:border-violet-500/30 focus:bg-stone-950/60"
        />
      </td>
      <td className="px-2 py-2">
        <input
          type="text"
          value={bet.bet}
          placeholder="Yankees -1.5"
          onChange={(e) => onUpdate(bet.id, { bet: e.target.value })}
          className="w-full rounded-xl border border-transparent bg-transparent px-3 py-2.5 text-sm font-medium text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-violet-500/30 focus:bg-stone-950/60"
        />
      </td>
      <td className="px-2 py-2">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">
            $
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={bet.wager || ''}
            placeholder="0"
            onChange={(e) =>
              onUpdate(bet.id, { wager: Number.parseFloat(e.target.value) || 0 })
            }
            className="w-full rounded-xl border border-transparent bg-transparent py-2.5 pl-7 pr-3 text-sm tabular-nums text-stone-200 outline-none transition focus:border-violet-500/30 focus:bg-stone-950/60"
          />
        </div>
      </td>
      <td className="px-2 py-2">
        <input
          type="text"
          value={bet.odds}
          placeholder="-110"
          onChange={(e) => onUpdate(bet.id, { odds: e.target.value })}
          className="w-full rounded-xl border border-transparent bg-transparent px-3 py-2.5 text-sm font-semibold tabular-nums text-emerald-400 outline-none transition placeholder:text-stone-600 focus:border-violet-500/30 focus:bg-stone-950/60"
        />
      </td>
      <td className="px-2 py-2">
        <div className="relative">
          <select
            value={bet.outcome}
            onChange={(e) =>
              onUpdate(bet.id, { outcome: e.target.value as BetOutcome })
            }
            className={cn(
              'w-full appearance-none rounded-xl border px-3 py-2.5 pr-8 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-violet-500/20',
              outcomeStyles(bet.outcome)
            )}
          >
            {OUTCOMES.map((option) => (
              <option key={option.value} value={option.value} className="bg-stone-900 text-stone-100">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
        </div>
      </td>
      <td className="px-4 py-2">
        <span className={cn('text-sm font-semibold tabular-nums', resultStyles(result, bet.outcome))}>
          {bet.outcome === 'pending' ? '—' : formatCurrency(result)}
        </span>
      </td>
      <td className="px-2 py-2 text-right">
        <button
          type="button"
          onClick={() => onRemove(bet.id)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-stone-600 opacity-0 transition group-hover:opacity-100 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
          aria-label="Delete bet"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-stone-600">
        {label}
      </span>
      {children}
    </label>
  );
}
