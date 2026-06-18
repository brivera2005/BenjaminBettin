import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  OAUTH_STATE_COOKIE,
  getGoogleAuthUrl,
} from '@/lib/auth';
import { getBindings } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { GOOGLE_CLIENT_ID, APP_URL } = await getBindings();

  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured' },
      { status: 500 }
    );
  }

  const state = crypto.randomUUID();
  const redirectUri = `${APP_URL}/auth/callback`;

  const cookieStore = await cookies();
  const secure = (await getBindings()).APP_URL.startsWith('https://');
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });

  const url = getGoogleAuthUrl(GOOGLE_CLIENT_ID, redirectUri, state);
  return NextResponse.redirect(url);
}
