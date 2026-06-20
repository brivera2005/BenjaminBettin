import type { Bet } from './types';
import { calculateBetResult } from './betMath';

export interface WeekRange {
  key: string;
  start: Date;
  end: Date;
  label: string;
  shortLabel: string;
}

const DAY_FMT = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function getWeekStartMonday(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function weekKeyFromDate(dateStr: string): string {
  return toIsoDate(getWeekStartMonday(parseLocalDate(dateStr)));
}

export function buildWeekRange(weekKey: string): WeekRange {
  const start = parseLocalDate(weekKey);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return {
    key: weekKey,
    start,
    end,
    label: `${DAY_FMT.format(start)} – ${DAY_FMT.format(end)}`,
    shortLabel: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
  };
}

type BetSortFields = Pick<Bet, 'bet_date' | 'wager' | 'created_at'>;

/** Newest day first; within a day, highest wager first. */
export function compareBetsByDayAndWager(a: BetSortFields, b: BetSortFields): number {
  const byDate = b.bet_date.localeCompare(a.bet_date);
  if (byDate !== 0) return byDate;

  const byWager = b.wager - a.wager;
  if (byWager !== 0) return byWager;

  return b.created_at.localeCompare(a.created_at);
}

export function sortBetsByDayAndWager<T extends BetSortFields>(bets: T[]): T[] {
  return [...bets].sort(compareBetsByDayAndWager);
}

export function groupBetsIntoWeeks(bets: Bet[]): WeekRange[] {
  const keys = new Set<string>();
  for (const bet of bets) {
    keys.add(weekKeyFromDate(bet.bet_date));
  }
  if (keys.size === 0) {
    const current = weekKeyFromDate(toIsoDate(new Date()));
    keys.add(current);
  }
  return [...keys].sort((a, b) => b.localeCompare(a)).map(buildWeekRange);
}

export function betsInWeek(bets: Bet[], week: WeekRange): Bet[] {
  const startMs = week.start.getTime();
  const endMs = week.end.getTime();
  return sortBetsByDayAndWager(
    bets.filter((bet) => {
      const t = parseLocalDate(bet.bet_date).getTime();
      return t >= startMs && t <= endMs;
    })
  );
}

export function weekProfit(bets: Bet[]): number {
  return bets.reduce(
    (sum, bet) => sum + calculateBetResult(bet.wager, bet.odds, bet.outcome),
    0
  );
}

export function formatShortDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function currentWeekKey(): string {
  return weekKeyFromDate(todayIso());
}

export function weekPageForMonth(weeks: WeekRange[], monthKey: string): number {
  const key = weekKeyFromDate(`${monthKey}-01`);
  const exact = weeks.findIndex((w) => w.key === key);
  if (exact >= 0) return exact;
  const overlap = weeks.findIndex(
    (w) => w.key.slice(0, 7) === monthKey || toIsoDate(w.end).slice(0, 7) === monthKey
  );
  return overlap >= 0 ? overlap : 0;
}
