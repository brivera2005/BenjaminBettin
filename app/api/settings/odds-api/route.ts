import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { getUserOddsApiKey, setUserOddsApiKey } from '@/lib/db';
import {
  getServerOddsApiKey,
  maskOddsApiKey,
  resolveOddsApiKey,
  validateOddsApiKey,
} from '@/lib/oddsApi';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolved = await resolveOddsApiKey(userId);
  const userKey = await getUserOddsApiKey(userId);
  const serverKey = await getServerOddsApiKey();

  return NextResponse.json({
    configured: Boolean(resolved),
    source: resolved?.source ?? null,
    userKeySaved: Boolean(userKey),
    hint: resolved ? maskOddsApiKey(resolved.key) : null,
    serverFallbackAvailable: Boolean(serverKey),
  });
}

export async function PUT(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { apiKey?: string };
  const apiKey = body.apiKey?.trim();

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 });
  }

  try {
    await validateOddsApiKey(apiKey);
    await setUserOddsApiKey(userId, apiKey);
    return NextResponse.json({
      ok: true,
      hint: maskOddsApiKey(apiKey),
      source: 'user' as const,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid API key';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await setUserOddsApiKey(userId, null);
  const resolved = await resolveOddsApiKey(userId);

  return NextResponse.json({
    ok: true,
    configured: Boolean(resolved),
    source: resolved?.source ?? null,
    hint: resolved ? maskOddsApiKey(resolved.key) : null,
  });
}
