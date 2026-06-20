import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { getUserTrackerName, setUserTrackerName } from '@/lib/db';
import { DEFAULT_TRACKER_NAME, displayTrackerName, normalizeTrackerName } from '@/lib/trackerName';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stored = await getUserTrackerName(userId);
  return NextResponse.json({
    trackerName: displayTrackerName(stored),
    customized: Boolean(stored),
    defaultName: DEFAULT_TRACKER_NAME,
  });
}

export async function PUT(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { trackerName?: string };
  const normalized = normalizeTrackerName(body.trackerName);
  await setUserTrackerName(userId, normalized);

  return NextResponse.json({
    ok: true,
    trackerName: displayTrackerName(normalized),
    customized: Boolean(normalized),
  });
}
