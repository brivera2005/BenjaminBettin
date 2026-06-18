import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  OAUTH_STATE_COOKIE,
  exchangeGoogleCode,
  setSessionCookie,
} from '@/lib/auth';
import { upsertUser } from '@/lib/db';
import { getBindings } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${origin}/?auth=error`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/?auth=error`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.set(OAUTH_STATE_COOKIE, '', { path: '/', maxAge: 0 });

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${origin}/?auth=error`);
  }

  try {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL } =
      await getBindings();
    const redirectUri = `${APP_URL}/auth/callback`;

    const user = await exchangeGoogleCode(
      code,
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    await upsertUser(user);
    await setSessionCookie(user.id);

    return NextResponse.redirect(`${origin}/`);
  } catch {
    return NextResponse.redirect(`${origin}/?auth=error`);
  }
}
