'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Zap } from 'lucide-react';
import { AutoGradeButton, type GradeResultItem } from '@/components/AutoGradeButton';
import { AppTabs, type AppTab } from '@/components/AppTabs';
import { AuthButton } from '@/components/AuthButton';
import {
  betToCompose,
  composeToInput,
  type ComposeValues,
} from '@/components/BetComposeForm';
import { BetCompactRow } from '@/components/BetCompactRow';
import { BetInlineEditRow } from '@/components/BetInlineEditRow';
import { BetQuickAddRow } from '@/components/BetQuickAddRow';
import { HistoryView } from '@/components/HistoryView';
import { DisplayModeProvider } from '@/components/DisplayModeContext';
import { MobileShellExtras } from '@/components/MobileShellExtras';
import { RunningTotalBanner } from '@/components/RunningTotalBanner';
import { SignInPrompt } from '@/components/SignInPrompt';
import { Toast, type ToastTone } from '@/components/Toast';
import { WeekPagination } from '@/components/WeekPagination';
import { useAuth } from '@/components/AuthProvider';
import { loadBetDefaults, saveBetDefaults } from '@/lib/betDefaults';
import { needsManualGrading } from '@/lib/betParse';
import { computeDailyRecaps, computeOverallStats, monthSummariesWithPrior } from '@/lib/betStats';
import { totalWithBaseline } from '@/lib/baseline';
import {
  calculateRunningTotal,
} from '@/lib/betMath';
import type { Bet, BetInput, BetOutcome } from '@/lib/types';
import {
  betsInWeek,
  currentWeekKey,
  groupBetsIntoWeeks,
  todayIso,
  weekKeyFromDate,
  weekPageForMonth,
} from '@/lib/weekUtils';

export default function BetTracker() {
  const { user, loading: authLoading } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loadingBets, setLoadingBets] = useState(false);
  const [weekPage, setWeekPage] = useState(0);
  const [activeTab, setActiveTab] = useState<AppTab>('bets');
  const [weekSearch, setWeekSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const [defaults, setDefaults] = useState(loadBetDefaults);
  const [autoGradeMissedIds, setAutoGradeMissedIds] = useState<Set<string>>(() => new Set());
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
    setToast({ message, tone });
  }, []);

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
      for (const timer of timers.values()) clearTimeout(timer);
    };
  }, []);

  const trackedProfit = useMemo(() => calculateRunningTotal(bets), [bets]);
  const runningTotal = useMemo(
    () => totalWithBaseline(trackedProfit),
    [trackedProfit]
  );
  const settledCount = useMemo(
    () => bets.filter((b) => b.outcome !== 'pending').length,
    [bets]
  );
  const winCount = useMemo(() => bets.filter((b) => b.outcome === 'win').length, [bets]);
  const lossCount = useMemo(() => bets.filter((b) => b.outcome === 'loss').length, [bets]);
  const winRate = useMemo(() => computeOverallStats(bets).winRate, [bets]);
  const dailyRecaps = useMemo(() => computeDailyRecaps(bets, todayIso()), [bets]);
  const pendingCount = useMemo(() => bets.filter((b) => b.outcome === 'pending').length, [bets]);
  const monthSummaries = useMemo(() => monthSummariesWithPrior(bets), [bets]);
  const lastBet = bets[0] ?? null;

  const weeks = useMemo(() => groupBetsIntoWeeks(bets), [bets]);
  const totalWeeks = weeks.length;
  const currentWeek = weeks[weekPage] ?? weeks[0];
  const weekBetsRaw = useMemo(
    () => (currentWeek ? betsInWeek(bets, currentWeek) : []),
    [bets, currentWeek]
  );
  const weekBets = useMemo(() => {
    const q = weekSearch.trim().toLowerCase();
    if (!q) return weekBetsRaw;
    return weekBetsRaw.filter((b) => b.bet.toLowerCase().includes(q));
  }, [weekBetsRaw, weekSearch]);
  const isCurrentWeek = currentWeek?.key === currentWeekKey();

  const showManualLegend = useMemo(
    () =>
      weekBetsRaw.some((b) =>
        needsManualGrading(b, autoGradeMissedIds.has(b.id)).manual
      ),
    [weekBetsRaw, autoGradeMissedIds]
  );

  useEffect(() => {
    if (weekPage >= totalWeeks && totalWeeks > 0) setWeekPage(totalWeeks - 1);
  }, [weekPage, totalWeeks]);

  const jumpToToday = useCallback(() => {
    const key = currentWeekKey();
    const idx = weeks.findIndex((w) => w.key === key);
    if (idx >= 0) setWeekPage(idx);
  }, [weeks]);

  const jumpToMonth = useCallback(
    (monthKey: string) => {
      if (monthKey.startsWith('prior-')) return;
      setActiveTab('bets');
      setWeekPage(weekPageForMonth(weeks, monthKey));
    },
    [weeks]
  );

  const handleAutoGraded = useCallback(
    async (payload: { graded: number; skipped: number; results: GradeResultItem[] }) => {
      const missed = new Set(
        payload.results.filter((r) => !r.outcome).map((r) => r.betId)
      );
      setAutoGradeMissedIds(missed);
      await loadBets();
      if (payload.graded > 0) {
        showToast(
          `Graded ${payload.graded} bet${payload.graded !== 1 ? 's' : ''}${payload.skipped > 0 ? ` · ${payload.skipped} highlighted yellow` : ''}`,
          'success'
        );
      } else if (payload.skipped > 0) {
        showToast(`${payload.skipped} bet${payload.skipped !== 1 ? 's' : ''} need manual grading`, 'info');
      } else {
        showToast('No pending bets matched finished games', 'info');
      }
    },
    [loadBets, showToast]
  );

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
            ? { ...bet, ...patch, updated_at: new Date().toISOString() }
            : bet
        )
      );
      persistUpdate(id, patch);
    },
    [persistUpdate]
  );

  const setOutcome = useCallback(
    (id: string, outcome: BetOutcome) => {
      updateBet(id, { outcome });
      if (outcome !== 'pending') {
        setAutoGradeMissedIds((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [updateBet]
  );

  const saveNewBet = useCallback(async (values: ComposeValues) => {
    saveBetDefaults(values);
    setDefaults({ wager: values.wager, odds: values.odds });
    const response = await fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(composeToInput(values)),
    });
    if (!response.ok) {
      showToast('Could not save bet', 'error');
      return;
    }
    const data = (await response.json()) as { bet: Bet };
    setBets((current) => {
      const next = [data.bet, ...current];
      const key = weekKeyFromDate(values.bet_date);
      const wks = groupBetsIntoWeeks(next);
      const idx = wks.findIndex((w) => w.key === key);
      if (idx >= 0) setWeekPage(idx);
      return next;
    });
    showToast('Bet saved', 'success');
  }, [showToast]);

  const saveEditBet = useCallback(
    (id: string, values: ComposeValues) => {
      saveBetDefaults(values);
      setDefaults({ wager: values.wager, odds: values.odds });
      updateBet(id, composeToInput(values));
      setEditingId(null);
      const key = weekKeyFromDate(values.bet_date);
      const idx = weeks.findIndex((w) => w.key === key);
      if (idx >= 0) setWeekPage(idx);
      showToast('Bet updated', 'success');
    },
    [updateBet, weeks, showToast]
  );

  const removeBet = useCallback(
    async (id: string) => {
      const previous = bets;
      setBets((current) => current.filter((bet) => bet.id !== id));
      setEditingId(null);
      const timer = saveTimers.current.get(id);
      if (timer) {
        clearTimeout(timer);
        saveTimers.current.delete(id);
      }
      const response = await fetch(`/api/bets/${id}`, { method: 'DELETE' });
      if (!response.ok) setBets(previous);
    },
    [bets]
  );

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
          <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2 sm:px-6">
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

  const repeatFrom: ComposeValues | null = lastBet
    ? { ...betToCompose(lastBet), bet_date: todayIso(), outcome: 'pending' }
    : null;

  return (
    <DisplayModeProvider>
    <div className="min-h-screen overflow-x-hidden bg-[#050505] text-stone-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-violet-900/20 blur-[140px]" />
        <div className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-emerald-900/10 blur-[140px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#050505]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2 sm:px-6">
          <BrandMark />
          <AuthButton />
        </div>
      </header>

      <AppTabs active={activeTab} onChange={setActiveTab} />

      <RunningTotalBanner
        total={runningTotal}
        settledCount={settledCount}
        winCount={winCount}
        lossCount={lossCount}
        winRate={winRate}
        dailyRecaps={dailyRecaps}
      />

      <Toast message={toast?.message ?? null} tone={toast?.tone} onDismiss={() => setToast(null)} />
      <MobileShellExtras />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-3 py-2 sm:px-6 sm:py-4">
        {loadingBets && bets.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          </div>
        ) : activeTab === 'history' ? (
          <HistoryView
            bets={bets}
            monthSummaries={monthSummaries}
            onJumpToMonth={jumpToMonth}
          />
        ) : (
          <>
            {currentWeek && (
              <WeekPagination
                week={currentWeek}
                page={weekPage}
                totalWeeks={totalWeeks}
                betCount={weekBetsRaw.length}
                isCurrentWeek={isCurrentWeek}
                onPageChange={setWeekPage}
                onJumpToToday={jumpToToday}
              />
            )}

            <AutoGradeButton
              pendingCount={pendingCount}
              onGraded={handleAutoGraded}
              onError={(m) => showToast(m, 'error')}
            />

            {weekBetsRaw.length > 3 && (
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-600" />
                <input
                  type="search"
                  value={weekSearch}
                  onChange={(e) => setWeekSearch(e.target.value)}
                  placeholder="Filter this week…"
                  className="w-full rounded-xl border border-white/5 bg-stone-900/40 py-2 pl-9 pr-3 text-xs text-stone-300 outline-none focus:border-violet-500/30"
                />
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-white/5 bg-stone-900/20">
              {showManualLegend && (
                <p className="border-b border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-center text-[10px] font-medium text-yellow-400/90">
                  Yellow outline = grade manually (tap outcome pill)
                </p>
              )}
              <div className="hidden items-center gap-1.5 border-b border-white/5 bg-stone-900/50 px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-stone-600 sm:flex">
                <span className="w-9">Date</span>
                <span className="flex-1">Bet</span>
                <span className="w-10 text-right">$</span>
                <span className="w-11 text-right">Odds</span>
                <span className="w-6 text-center">St</span>
                <span className="w-12 text-right">P/L</span>
                <span className="w-6" />
              </div>

              <BetQuickAddRow
                defaults={defaults}
                repeatFrom={repeatFrom}
                onSave={saveNewBet}
              />

              {weekBets.length === 0 ? (
                weekSearch ? (
                  <p className="px-4 py-6 text-center text-xs text-stone-600">
                    No matches — try a different filter.
                  </p>
                ) : bets.length > 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-stone-600">
                    No bets this week — add one above or swipe to other weeks.
                  </p>
                ) : null
              ) : (
                weekBets.map((bet) =>
                  editingId === bet.id ? (
                    <BetInlineEditRow
                      key={bet.id}
                      initial={betToCompose(bet)}
                      onSave={(v) => saveEditBet(bet.id, v)}
                      onCancel={() => setEditingId(null)}
                      onDelete={() => removeBet(bet.id)}
                    />
                  ) : (
                    <BetCompactRow
                      key={bet.id}
                      bet={bet}
                      autoGradeMissed={autoGradeMissedIds.has(bet.id)}
                      onOutcomeChange={setOutcome}
                      onEdit={setEditingId}
                    />
                  )
                )
              )}
            </div>

            {currentWeek && totalWeeks > 1 && (
              <WeekPagination
                week={currentWeek}
                page={weekPage}
                totalWeeks={totalWeeks}
                betCount={weekBetsRaw.length}
                isCurrentWeek={isCurrentWeek}
                onPageChange={setWeekPage}
                onJumpToToday={jumpToToday}
              />
            )}
          </>
        )}
      </main>
    </div>
    </DisplayModeProvider>
  );
}

function BrandMark() {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-500/30 bg-gradient-to-br from-violet-600 to-violet-950 shadow-violet-900/20">
        <Zap className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="min-w-0">
        <h1 className="truncate text-sm font-black uppercase italic tracking-tighter sm:text-base">
          Benjamin<span className="text-violet-500">Bettin&apos;</span>
        </h1>
        <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-stone-600 sm:text-[9px]">
          Bet Tracker
        </p>
      </div>
    </div>
  );
}
