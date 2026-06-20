'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrandMark } from '@/components/BrandMark';
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
import { DayPagination } from '@/components/DayPagination';
import { HistoryView } from '@/components/HistoryView';
import { SettingsView } from '@/components/SettingsView';
import { DisplayModeProvider } from '@/components/DisplayModeContext';
import { MobileShellExtras } from '@/components/MobileShellExtras';
import { PremiumUpgrade } from '@/components/PremiumUpgrade';
import { RunningTotalBanner } from '@/components/RunningTotalBanner';
import { SignInPrompt } from '@/components/SignInPrompt';
import { Toast, type ToastTone } from '@/components/Toast';
import { useAuth } from '@/components/AuthProvider';
import { loadBetDefaults, saveBetDefaults } from '@/lib/betDefaults';
import { PREMIUM_ENABLED } from '@/lib/mobileConfig';
import { needsManualGrading } from '@/lib/betParse';
import { computeDailyRecaps, computeDailyProfitByDate, computeOverallStats, monthSummariesWithPrior } from '@/lib/betStats';
import { totalWithBaseline } from '@/lib/baseline';
import {
  calculateRunningTotal,
} from '@/lib/betMath';
import type { Bet, BetInput, BetOutcome } from '@/lib/types';
import {
  betsOnDate,
  dayPageForMonth,
  formatDayLabel,
  navigableBetDates,
  todayIso,
} from '@/lib/weekUtils';

export default function BetTracker() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loadingBets, setLoadingBets] = useState(false);
  const [dayPage, setDayPage] = useState(0);
  const [activeTab, setActiveTab] = useState<AppTab>('bets');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const [defaults, setDefaults] = useState(loadBetDefaults);
  const [autoGradeMissedIds, setAutoGradeMissedIds] = useState<Set<string>>(new Set());
  const [oddsApiRefreshKey, setOddsApiRefreshKey] = useState(0);
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
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    const premiumResult = params.get('premium');
    if (!premiumResult) return;

    window.history.replaceState({}, '', window.location.pathname);

    if (premiumResult === 'cancel') {
      showToast('Checkout canceled', 'info');
      return;
    }

    if (premiumResult !== 'success') return;

    showToast('Payment received — unlocking premium…', 'success');

    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;
      await refreshUser();
      if (user?.premium || attempts >= 15) {
        window.clearInterval(timer);
        if (attempts >= 15 && !user?.premium) {
          showToast('Premium may take a moment — refresh if badge is missing', 'info');
        }
      }
    }, 2000);

    return () => window.clearInterval(timer);
  }, [user, refreshUser, showToast]);

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
  const dailyProfitByDate = useMemo(() => computeDailyProfitByDate(bets), [bets]);
  const pendingCount = useMemo(() => bets.filter((b) => b.outcome === 'pending').length, [bets]);
  const monthSummaries = useMemo(() => monthSummariesWithPrior(bets), [bets]);

  const betDates = useMemo(() => navigableBetDates(bets), [bets]);
  const totalDays = betDates.length;
  const currentDate = betDates[dayPage] ?? betDates[0] ?? todayIso();
  const dayBets = useMemo(
    () => betsOnDate(bets, currentDate),
    [bets, currentDate]
  );
  const isToday = currentDate === todayIso();

  const showManualLegend = useMemo(
    () =>
      dayBets.some((b) =>
        needsManualGrading(b, autoGradeMissedIds.has(b.id)).manual
      ),
    [dayBets, autoGradeMissedIds]
  );

  useEffect(() => {
    if (dayPage >= totalDays && totalDays > 0) setDayPage(totalDays - 1);
  }, [dayPage, totalDays]);

  const jumpToToday = useCallback(() => {
    const idx = betDates.findIndex((d) => d === todayIso());
    if (idx >= 0) setDayPage(idx);
  }, [betDates]);

  const jumpToMonth = useCallback(
    (monthKey: string) => {
      if (monthKey.startsWith('prior-')) return;
      setActiveTab('bets');
      setDayPage(dayPageForMonth(betDates, monthKey));
    },
    [betDates]
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
      const dates = navigableBetDates(next);
      const idx = dates.findIndex((d) => d === values.bet_date);
      if (idx >= 0) setDayPage(idx);
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
      const idx = navigableBetDates(bets).findIndex((d) => d === values.bet_date);
      if (idx >= 0) setDayPage(idx);
      showToast('Bet updated', 'success');
    },
    [updateBet, bets, showToast]
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-violet-900/20 blur-[140px]" />
        </div>
        <header className="sticky top-0 z-40 border-b border-border-subtle bg-header backdrop-blur-2xl">
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

  return (
    <DisplayModeProvider>
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-violet-900/20 blur-[140px]" />
        <div className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-emerald-900/10 blur-[140px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border-subtle bg-header backdrop-blur-2xl">
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
        ) : activeTab === 'settings' ? (
          <SettingsView onSaved={() => setOddsApiRefreshKey((k) => k + 1)} />
        ) : (
          <>
            <DayPagination
              label={formatDayLabel(currentDate)}
              page={dayPage}
              totalDays={totalDays}
              betCount={dayBets.length}
              isToday={isToday}
              onPageChange={setDayPage}
              onJumpToToday={jumpToToday}
            />

            <AutoGradeButton
              pendingCount={pendingCount}
              configRefreshKey={oddsApiRefreshKey}
              onGraded={handleAutoGraded}
              onError={(m) => showToast(m, 'error')}
            />

            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
              {showManualLegend && (
                <p className="border-b border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-center text-[10px] font-medium text-yellow-700">
                  Yellow outline = grade manually (tap outcome pill)
                </p>
              )}
              <div className="hidden items-center gap-1.5 border-b border-border-subtle bg-surface-strong px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground sm:flex">
                <span className="w-9">Date</span>
                <span className="flex-1 text-right">Bet</span>
                <span className="w-10 text-right">$</span>
                <span className="w-11 text-right">Odds</span>
                <span className="w-6 text-center">St</span>
                <span className="w-12 text-right">P/L</span>
                <span className="w-6" />
              </div>

              <BetQuickAddRow
                betDate={currentDate}
                defaults={defaults}
                dailyProfitByDate={dailyProfitByDate}
                onSave={saveNewBet}
              />

              {dayBets.length === 0 ? (
                bets.length > 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                    No bets this day — add one above or swipe to other days.
                  </p>
                ) : null
              ) : (
                dayBets.map((bet) =>
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

            {totalDays > 1 && (
              <DayPagination
                label={formatDayLabel(currentDate)}
                page={dayPage}
                totalDays={totalDays}
                betCount={dayBets.length}
                isToday={isToday}
                onPageChange={setDayPage}
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

