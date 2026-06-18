import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getBindings } from './env';
import type { User } from './types';

export const SESSION_COOKIE = 'bb_session';
export const OAUTH_STATE_COOKIE = 'bb_oauth_state';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

async function useSecureCookies(): Promise<boolean> {
  const { APP_URL } = await getBindings();
  return APP_URL.startsWith('https://');
}

async function getSecret(): Promise<Uint8Array> {
  const { AUTH_SECRET } = await getBindings();
  if (!AUTH_SECRET) {
    throw new Error('AUTH_SECRET is not configured');
  }
  return new TextEncoder().encode(AUTH_SECRET);
}

export async function createSessionToken(userId: string): Promise<string> {
  const secret = await getSecret();
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const secret = await getSecret();
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(userId: string): Promise<void> {
  const token = await createSessionToken(userId);
  const cookieStore = await cookies();
  const secure = await useSecureCookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const secure = await useSecureCookies();
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export function getGoogleAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export async function exchangeGoogleCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<User> {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange Google authorization code');
  }

  const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

  const profileResponse = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }
  );

  if (!profileResponse.ok) {
    throw new Error('Failed to fetch Google profile');
  }

  const profile = (await profileResponse.json()) as GoogleUserInfo;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name ?? null,
    avatar_url: profile.picture ?? null,
  };
}
