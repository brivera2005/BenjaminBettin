import type { Bet, BetOutcome } from './types';

export function parseAmericanOdds(odds: string): number | null {
  const trimmed = odds.trim();
  if (!trimmed) return null;

  const normalized = trimmed.startsWith('+') ? trimmed.slice(1) : trimmed;
  const value = Number.parseFloat(normalized);

  if (!Number.isFinite(value) || value === 0) return null;
  return value;
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

export function formatRunningTotal(value: number): string {
  if (value === 0) return '$0.00';
  return formatCurrency(value);
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
