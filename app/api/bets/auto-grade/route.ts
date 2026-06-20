import { NextResponse } from 'next/server';
import { gradePendingBets } from '@/lib/autoGrade';
import { getSessionUserId } from '@/lib/auth';
import { listBetsForUser, updateBet } from '@/lib/db';
import { fetchCompletedScores, getOddsApiKey } from '@/lib/oddsApi';

export const dynamic = 'force-dynamic';

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = await getOddsApiKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'not_configured',
        message:
          'Add a free API key from the-odds-api.com as ODDS_API_KEY (500 credits/month).',
      },
      { status: 503 }
    );
  }

  const bets = await listBetsForUser(userId);
  const pending = bets.filter((b) => b.outcome === 'pending');
  if (pending.length === 0) {
    return NextResponse.json({ graded: 0, skipped: 0, results: [] });
  }

  let games;
  try {
    games = await fetchCompletedScores(3);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch scores';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const results = gradePendingBets(bets, games);
  const graded: typeof results = [];
  const skipped: typeof results = [];

  for (const result of results) {
    if (result.outcome) {
      await updateBet(userId, result.betId, { outcome: result.outcome });
      graded.push(result);
    } else {
      skipped.push(result);
    }
  }

  return NextResponse.json({
    graded: graded.length,
    skipped: skipped.length,
    results: [...graded, ...skipped],
  });
}

export async function GET() {
  const configured = Boolean(await getOddsApiKey());
  return NextResponse.json({ configured });
}
