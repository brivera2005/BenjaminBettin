import { getBindings } from './env';

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

export async function getOddsApiKey(): Promise<string | null> {
  const { ODDS_API_KEY } = await getBindings();
  const key = ODDS_API_KEY?.trim();
  return key || null;
}

export async function fetchCompletedScores(daysFrom = 3): Promise<OddsApiScore[]> {
  const apiKey = await getOddsApiKey();
  if (!apiKey) {
    throw new Error('ODDS_API_KEY not configured');
  }

  const all: OddsApiScore[] = [];

  for (const sport of SCORE_SPORTS) {
    const url = new URL(`${ODDS_API_BASE}/sports/${sport}/scores/`);
    url.searchParams.set('apiKey', apiKey);
    url.searchParams.set('daysFrom', String(daysFrom));
    url.searchParams.set('dateFormat', 'iso');

    const response = await fetch(url.toString(), {
      next: { revalidate: 0 },
    });

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
