import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { createBet, listBetsForUser } from '@/lib/db';
import type { BetInput } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bets = await listBetsForUser(userId);
  return NextResponse.json({ bets });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as BetInput;
  const bet = await createBet(userId, body);
  return NextResponse.json({ bet }, { status: 201 });
}
