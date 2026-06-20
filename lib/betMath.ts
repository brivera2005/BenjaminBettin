import type { Bet, BetOutcome } from './types';

export function parseAmericanOdds(odds: string): number | null {
  const trimmed = odds.trim();
  if (!trimmed) return null;

  const normalized = trimmed.startsWith('+') ? trimmed.slice(1) : trimmed;
  const value = Number.parseFloat(normalized);

  if (!Number.isFinite(value) || value === 0) return null;
  return value;
}

/** Display American odds with a leading + for positive values (e.g. 105 → +105). */
export function formatAmericanOddsDisplay(odds: string): string {
  const trimmed = odds.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('+') || trimmed.startsWith('-')) return trimmed;

  const value = parseAmericanOdds(trimmed);
  if (value === null) return trimmed;
  if (value > 0) return `+${trimmed}`;
  return trimmed;
}

export function calculateBetResult(
  wager: number,
  odds: string,
  outcome: BetOutcome
): number {
  if (outcome === 'pending' || outcome === 'push') return 0;
  if (outcome === 'loss') return -Math.abs(wager);

  const americanOdds = parseAmericanOdds(odds);
  if (americanOdds === null || wager <= 0) return 0;

  if (americanOdds > 0) {
    return wager * (americanOdds / 100);
  }

  return wager / (Math.abs(americanOdds) / 100);
}

export function calculateRunningTotal(
  bets: Pick<Bet, 'wager' | 'odds' | 'outcome'>[]
): number {
  return bets.reduce(
    (total, bet) => total + calculateBetResult(bet.wager, bet.odds, bet.outcome),
    0
  );
}

export function formatCurrency(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

export const UNIT_SIZE = 10;

export function dollarsToUnits(dollars: number): number {
  return Math.round(dollars / UNIT_SIZE);
}

export function unitsToDollars(units: number): number {
  return units * UNIT_SIZE;
}

export type MoneyDisplayMode = 'dollars' | 'units';

export function formatMoney(value: number, mode: MoneyDisplayMode): string {
  if (mode === 'units') {
    const units = dollarsToUnits(value);
    if (units === 0) return '0u';
    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    return `${sign}${Math.abs(units)}u`;
  }
  return formatCurrency(value);
}

export function formatRunningTotal(value: number, mode: MoneyDisplayMode = 'dollars'): string {
  if (mode === 'units') {
    return formatMoney(value, 'units');
  }
  if (value === 0) return '$0.00';
  return formatCurrency(value);
}

export function formatWager(value: number, mode: MoneyDisplayMode): string {
  if (mode === 'units') return `${dollarsToUnits(value)}u`;
  return `$${value}`;
}

export function outcomeLabel(outcome: BetOutcome): string {
  switch (outcome) {
    case 'win':
      return 'Win';
    case 'loss':
      return 'Loss';
    case 'push':
      return 'Push';
    default:
      return 'Pending';
  }
}

export interface MonthSummary {
  key: string;
  label: string;
  profit: number;
  totalBets: number;
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
}

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

export function computeMonthSummaries(
  bets: Pick<Bet, 'bet_date' | 'wager' | 'odds' | 'outcome'>[]
): MonthSummary[] {
  const map = new Map<string, MonthSummary>();

  for (const bet of bets) {
    const key = bet.bet_date.slice(0, 7);
    const [year, month] = key.split('-').map(Number);
    const label = MONTH_FORMATTER.format(new Date(year, month - 1, 1));

    const existing = map.get(key) ?? {
      key,
      label,
      profit: 0,
      totalBets: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      pending: 0,
    };

    existing.totalBets += 1;
    if (bet.outcome === 'win') existing.wins += 1;
    else if (bet.outcome === 'loss') existing.losses += 1;
    else if (bet.outcome === 'push') existing.pushes += 1;
    else existing.pending += 1;

    if (bet.outcome !== 'pending') {
      existing.profit += calculateBetResult(bet.wager, bet.odds, bet.outcome);
    }

    map.set(key, existing);
  }

  return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
}
