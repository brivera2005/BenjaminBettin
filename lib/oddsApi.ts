import { getBindings } from './env';
import { getUserOddsApiKey } from './db';

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

/** Sports queried for completed scores (2 API credits each with daysFrom). */
export const SCORE_SPORTS = [
  'americanfootball_nfl',
  'basketball_nba',
  'baseball_mlb',
  'icehockey_nhl',
  'basketball_ncaab',
  'americanfootball_ncaaf',
] as const;

export interface OddsApiScore {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  completed: boolean;
  home_team: string;
  away_team: string;
  scores: { name: string; score: string }[] | null;
  last_update: string | null;
}

export type OddsApiKeySource = 'user' | 'server';

export function maskOddsApiKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 4) return '••••';
  return `••••${trimmed.slice(-4)}`;
}

export async function getServerOddsApiKey(): Promise<string | null> {
  const { ODDS_API_KEY } = await getBindings();
  const key = ODDS_API_KEY?.trim();
  return key || null;
}

export async function resolveOddsApiKey(
  userId: string
): Promise<{ key: string; source: OddsApiKeySource } | null> {
  const userKey = await getUserOddsApiKey(userId);
  if (userKey) return { key: userKey, source: 'user' };

  const serverKey = await getServerOddsApiKey();
  if (serverKey) return { key: serverKey, source: 'server' };

  return null;
}

export async function validateOddsApiKey(apiKey: string): Promise<void> {
  const url = new URL(`${ODDS_API_BASE}/sports/baseball_mlb/scores/`);
  url.searchParams.set('apiKey', apiKey.trim());
  url.searchParams.set('daysFrom', '1');

  const response = await fetch(url.toString(), { cache: 'no-store' });
  if (response.status === 401) {
    throw new Error('Invalid Odds API key');
  }
  if (!response.ok) {
    throw new Error(`Odds API returned ${response.status}`);
  }
}

export async function fetchCompletedScores(
  apiKey: string,
  daysFrom = 3
): Promise<OddsApiScore[]> {
  const all: OddsApiScore[] = [];

  for (const sport of SCORE_SPORTS) {
    const url = new URL(`${ODDS_API_BASE}/sports/${sport}/scores/`);
    url.searchParams.set('apiKey', apiKey);
    url.searchParams.set('daysFrom', String(daysFrom));
    url.searchParams.set('dateFormat', 'iso');

    const response = await fetch(url.toString(), { cache: 'no-store' });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid Odds API key');
      }
      continue;
    }

    const data = (await response.json()) as OddsApiScore[];
    for (const game of data) {
      if (game.completed && game.scores?.length) {
        all.push(game);
      }
    }
  }

  return all;
}
