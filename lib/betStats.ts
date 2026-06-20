import { calculateBetResult, computeMonthSummaries, type MonthSummary } from './betMath';
import { PRIOR_PERIODS, priorPeriodSummaries, totalPriorProfit } from './baseline';
import type { Bet } from './types';
import { addDays, todayIso } from './weekUtils';

export interface CumulativePoint {
  date: string;
  label: string;
  profit: number;
  cumulative: number;
}

export interface OverallStats {
  totalBets: number;
  settled: number;
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
  winRate: number | null;
  profit: number;
  totalWagered: number;
  roi: number | null;
  avgWager: number;
}

const SHORT_DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

export function computeOverallStats(bets: Bet[]): OverallStats {
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let pending = 0;
  let profit = 0;
  let totalWagered = 0;

  for (const bet of bets) {
    if (bet.outcome === 'win') wins += 1;
    else if (bet.outcome === 'loss') losses += 1;
    else if (bet.outcome === 'push') pushes += 1;
    else pending += 1;

    if (bet.outcome !== 'pending') {
      profit += calculateBetResult(bet.wager, bet.odds, bet.outcome);
      totalWagered += bet.wager;
    }
  }

  const decided = wins + losses;
  const winRate = decided > 0 ? Math.round((wins / decided) * 100) : null;
  const roi = totalWagered > 0 ? Math.round((profit / totalWagered) * 1000) / 10 : null;

  return {
    totalBets: bets.length,
    settled: wins + losses + pushes,
    wins,
    losses,
    pushes,
    pending,
    winRate,
    profit: profit + totalPriorProfit(),
    totalWagered,
    roi,
    avgWager: bets.length > 0 ? Math.round((bets.reduce((s, b) => s + b.wager, 0) / bets.length) * 100) / 100 : 0,
  };
}

export function computeCumulativeSeries(bets: Bet[]): CumulativePoint[] {
  const settled = bets
    .filter((b) => b.outcome !== 'pending')
    .sort((a, b) => {
      const byDate = a.bet_date.localeCompare(b.bet_date);
      return byDate !== 0 ? byDate : a.created_at.localeCompare(b.created_at);
    });

  let cumulative = 0;
  const points: CumulativePoint[] = [];

  for (const period of PRIOR_PERIODS) {
    cumulative += period.profit;
    points.push({
      date: period.anchorDate,
      label: period.label,
      profit: period.profit,
      cumulative,
    });
  }

  for (const bet of settled) {
    const profit = calculateBetResult(bet.wager, bet.odds, bet.outcome);
    cumulative += profit;
    const [y, m, d] = bet.bet_date.split('-').map(Number);
    const label = SHORT_DATE.format(new Date(y, m - 1, d));
    points.push({ date: bet.bet_date, label, profit, cumulative });
  }

  return points;
}

export function monthSummariesChronological(bets: Bet[]): MonthSummary[] {
  const tracked = [...computeMonthSummaries(bets)].reverse();
  return [...priorPeriodSummaries(), ...tracked];
}

export function monthSummariesWithPrior(
  bets: Pick<Bet, 'bet_date' | 'wager' | 'odds' | 'outcome'>[]
): MonthSummary[] {
  return [...priorPeriodSummaries(), ...computeMonthSummaries(bets)];
}

export interface DailyRecap {
  label: string;
  profit: number;
  wins: number;
  losses: number;
  pending: number;
  total: number;
}

export interface DailyProfitEntry {
  profit: number;
  hasSettled: boolean;
}

export function computeDailyProfitByDate(
  bets: Pick<Bet, 'bet_date' | 'wager' | 'odds' | 'outcome'>[]
): Map<string, DailyProfitEntry> {
  const map = new Map<string, DailyProfitEntry>();

  for (const bet of bets) {
    const entry = map.get(bet.bet_date) ?? { profit: 0, hasSettled: false };
    if (bet.outcome !== 'pending') {
      entry.hasSettled = true;
      entry.profit += calculateBetResult(bet.wager, bet.odds, bet.outcome);
    }
    map.set(bet.bet_date, entry);
  }

  return map;
}

function summarizeDateRange(
  bets: Pick<Bet, 'bet_date' | 'wager' | 'odds' | 'outcome'>[],
  start: string,
  end: string
): Omit<DailyRecap, 'label'> {
  let profit = 0;
  let wins = 0;
  let losses = 0;
  let pending = 0;
  let total = 0;

  for (const bet of bets) {
    if (bet.bet_date < start || bet.bet_date > end) continue;
    total += 1;
    if (bet.outcome === 'win') wins += 1;
    else if (bet.outcome === 'loss') losses += 1;
    else if (bet.outcome === 'pending') pending += 1;

    if (bet.outcome !== 'pending') {
      profit += calculateBetResult(bet.wager, bet.odds, bet.outcome);
    }
  }

  return { profit, wins, losses, pending, total };
}

export function computeDailyRecaps(
  bets: Pick<Bet, 'bet_date' | 'wager' | 'odds' | 'outcome'>[],
  today = todayIso()
): DailyRecap[] {
  const yesterday = addDays(today, -1);

  return [
    {
      label: 'Last 10',
      ...summarizeDateRange(bets, addDays(today, -9), today),
    },
    {
      label: 'Last 5',
      ...summarizeDateRange(bets, addDays(today, -4), today),
    },
    {
      label: 'Yesterday',
      ...summarizeDateRange(bets, yesterday, yesterday),
    },
  ];
}
