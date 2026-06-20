import type { MonthSummary } from './betMath';

export interface PriorPeriod {
  key: string;
  label: string;
  profit: number;
  anchorDate: string;
}

/** Profit tracked outside the app before in-app logging from June 19. */
export const PRIOR_PERIODS: PriorPeriod[] = [
  { key: 'prior-jan-may', label: 'Jan – May (prior)', profit: 901.56, anchorDate: '2025-05-31' },
  { key: 'prior-june', label: 'June 1–18 (prior)', profit: 922.42, anchorDate: '2026-06-18' },
];

export function totalPriorProfit(): number {
  return PRIOR_PERIODS.reduce((sum, p) => sum + p.profit, 0);
}

export function isPriorPeriodKey(key: string): boolean {
  return PRIOR_PERIODS.some((p) => p.key === key);
}

export function totalWithBaseline(trackedProfit: number): number {
  return totalPriorProfit() + trackedProfit;
}

export function priorPeriodSummaries(): MonthSummary[] {
  return PRIOR_PERIODS.map((p) => ({
    key: p.key,
    label: p.label,
    profit: p.profit,
    totalBets: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    pending: 0,
  }));
}

/** @deprecated use totalPriorProfit */
export const PRIOR_PERIOD_PROFIT = totalPriorProfit();
