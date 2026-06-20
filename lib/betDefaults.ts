import type { ComposeValues } from '@/components/BetComposeForm';

const STORAGE_KEY = 'benjamin-bettin-defaults';

export interface BetDefaults {
  wager: number;
  odds: string;
}

const FALLBACK: BetDefaults = { wager: 100, odds: '-110' };

export function loadBetDefaults(): BetDefaults {
  if (typeof window === 'undefined') return FALLBACK;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return FALLBACK;
    const parsed = JSON.parse(raw) as Partial<BetDefaults>;
    return {
      wager: typeof parsed.wager === 'number' && parsed.wager > 0 ? parsed.wager : FALLBACK.wager,
      odds: typeof parsed.odds === 'string' && parsed.odds.trim() ? parsed.odds : FALLBACK.odds,
    };
  } catch {
    return FALLBACK;
  }
}

export function saveBetDefaults(values: Pick<ComposeValues, 'wager' | 'odds'>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ wager: values.wager, odds: values.odds })
    );
  } catch {
    // ignore quota errors
  }
}
