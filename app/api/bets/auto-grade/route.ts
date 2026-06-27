import { NextResponse } from 'next/server';
import { gradePendingBets } from '@/lib/autoGrade';
import { getSessionUserId } from '@/lib/auth';
import { listBetsForUser, updateBet } from '@/lib/db';
import { fetchCompletedScores, resolveOddsApiKey } from '@/lib/oddsApi';

export const dynamic = 'force-dynamic';

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolved = await resolveOddsApiKey(userId);
  if (!resolved) {
    return NextResponse.json(
      {
        error: 'not_configured',
        message: 'Add your free Odds API key in Settings to enable auto-grade.',
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
    games = await fetchCompletedScores(resolved.key, 3);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch scores';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const results = gradePendingBets(pending, games);
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
    keySource: resolved.source,
  });
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ configured: false, source: null });
  }

  const resolved = await resolveOddsApiKey(userId);
  return NextResponse.json({
    configured: Boolean(resolved),
    source: resolved?.source ?? null,
  });
}
