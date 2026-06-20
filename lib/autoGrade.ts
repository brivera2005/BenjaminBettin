import { isParlayLike, parseBetDescription } from './betParse';
import type { OddsApiScore } from './oddsApi';
import type { Bet, BetOutcome } from './types';

export interface GradeResult {
  betId: string;
  bet: string;
  outcome: BetOutcome | null;
  reason: string;
  matchedGame?: string;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s.+-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function teamMatches(betNorm: string, team: string): boolean {
  const teamNorm = normalize(team);
  if (betNorm.includes(teamNorm)) return true;

  const words = teamNorm.split(' ').filter((w) => w.length >= 3);
  for (const word of words) {
    if (betNorm.includes(word)) return true;
  }

  const nickname = words[words.length - 1];
  if (nickname && nickname.length >= 4) {
    const re = new RegExp(`\\b${nickname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(betNorm)) return true;
  }

  return false;
}

function scoreForTeam(game: OddsApiScore, team: string): number | null {
  const entry = game.scores?.find(
    (s) => normalize(s.name) === normalize(team) || teamMatches(normalize(team), s.name)
  );
  if (!entry) return null;
  const n = Number.parseInt(entry.score, 10);
  return Number.isFinite(n) ? n : null;
}

function findMatchingGame(teamHint: string, games: OddsApiScore[]): OddsApiScore | null {
  const betNorm = normalize(teamHint);
  if (!betNorm) return null;

  let best: OddsApiScore | null = null;
  let bestRank = 0;

  for (const game of games) {
    const home = teamMatches(betNorm, game.home_team);
    const away = teamMatches(betNorm, game.away_team);

    if (home && away) return game;

    if (home || away) {
      const rank = home && away ? 2 : 1;
      if (rank > bestRank) {
        best = game;
        bestRank = rank;
      }
    }
  }

  return best;
}

function pickedTeam(teamHint: string, game: OddsApiScore): 'home' | 'away' | null {
  const betNorm = normalize(teamHint);
  const home = teamMatches(betNorm, game.home_team);
  const away = teamMatches(betNorm, game.away_team);

  if (home && !away) return 'home';
  if (away && !home) return 'away';

  const homeNick = normalize(game.home_team).split(' ').pop() ?? '';
  const awayNick = normalize(game.away_team).split(' ').pop() ?? '';
  const homeIdx = homeNick ? betNorm.indexOf(homeNick) : -1;
  const awayIdx = awayNick ? betNorm.indexOf(awayNick) : -1;

  if (homeIdx >= 0 && awayIdx < 0) return 'home';
  if (awayIdx >= 0 && homeIdx < 0) return 'away';
  if (homeIdx >= 0 && awayIdx >= 0) return homeIdx <= awayIdx ? 'home' : 'away';

  return home ? 'home' : away ? 'away' : null;
}

function gradeTotal(
  line: number,
  game: OddsApiScore,
  side: 'home' | 'away' | null,
  market: 'over' | 'under',
  teamTotal: boolean
): BetOutcome | null {
  let total: number | null;

  if (teamTotal) {
    if (!side) return null;
    const team = side === 'home' ? game.home_team : game.away_team;
    total = scoreForTeam(game, team);
  } else {
    const home = scoreForTeam(game, game.home_team);
    const away = scoreForTeam(game, game.away_team);
    if (home === null || away === null) return null;
    total = home + away;
  }

  if (total === null) return null;
  if (total === line) return 'push';

  if (market === 'over') return total > line ? 'win' : 'loss';
  return total < line ? 'win' : 'loss';
}

function gradeSpread(
  line: number,
  game: OddsApiScore,
  side: 'home' | 'away'
): BetOutcome | null {
  const home = scoreForTeam(game, game.home_team);
  const away = scoreForTeam(game, game.away_team);
  if (home === null || away === null) return null;

  const margin = home - away;
  const adjusted = side === 'home' ? margin + line : -margin + line;

  if (adjusted === 0) return 'push';
  return adjusted > 0 ? 'win' : 'loss';
}

function gradeMoneyline(game: OddsApiScore, side: 'home' | 'away'): BetOutcome | null {
  const home = scoreForTeam(game, game.home_team);
  const away = scoreForTeam(game, game.away_team);
  if (home === null || away === null) return null;

  if (home === away) return 'push';

  const homeWon = home > away;
  const pickedWon = side === 'home' ? homeWon : !homeWon;
  return pickedWon ? 'win' : 'loss';
}

export function gradeBet(bet: Pick<Bet, 'bet'>, games: OddsApiScore[]): GradeResult {
  const base = { betId: '', bet: bet.bet, outcome: null as BetOutcome | null, reason: '' };

  if (!bet.bet.trim()) {
    return { ...base, reason: 'No bet description' };
  }

  const parsed = parseBetDescription(bet.bet);

  if (parsed.unsupported || parsed.market === 'parlay' || isParlayLike(bet.bet)) {
    return { ...base, reason: parsed.unsupported ?? 'Parlay — grade manually when all legs settle' };
  }

  const lookupText = parsed.teamHint || bet.bet;

  const game = findMatchingGame(lookupText, games);
  if (!game) {
    return { ...base, reason: 'No matching completed game — use team name (Yankees, Lakers)' };
  }

  const gameLabel = `${game.away_team} @ ${game.home_team}`;
  const side = pickedTeam(lookupText, game);

  if (parsed.market === 'over' || parsed.market === 'under') {
    if (parsed.line === undefined) {
      return { ...base, reason: 'Missing total line (e.g. O9.5)', matchedGame: gameLabel };
    }
    if (parsed.teamTotal && !side) {
      return { ...base, reason: 'Team total needs a team name', matchedGame: gameLabel };
    }
    const outcome = gradeTotal(parsed.line, game, side, parsed.market, parsed.teamTotal);
    if (outcome) {
      const kind = parsed.teamTotal ? 'Team total' : 'Game total';
      return {
        ...base,
        outcome,
        reason: `${kind} ${parsed.market} (${outcome})`,
        matchedGame: gameLabel,
      };
    }
  }

  if (parsed.market === 'spread') {
    if (parsed.line === undefined || !side) {
      return {
        ...base,
        reason: side ? 'Missing spread line' : 'Could not identify team for spread',
        matchedGame: gameLabel,
      };
    }
    const outcome = gradeSpread(parsed.line, game, side);
    if (outcome) {
      return { ...base, outcome, reason: `Spread (${outcome})`, matchedGame: gameLabel };
    }
  }

  if (!side) {
    return { ...base, reason: 'Could not identify picked team', matchedGame: gameLabel };
  }

  const outcome = gradeMoneyline(game, side);
  if (outcome) {
    return { ...base, outcome, reason: `Moneyline (${outcome})`, matchedGame: gameLabel };
  }

  return { ...base, reason: 'Could not grade bet', matchedGame: gameLabel };
}

export function gradePendingBets(bets: Bet[], games: OddsApiScore[]): GradeResult[] {
  return bets
    .filter((b) => b.outcome === 'pending')
    .map((b) => ({ ...gradeBet(b, games), betId: b.id }));
}
