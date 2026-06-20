import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import { getBindings } from '@/lib/env';
import { userHasPremium } from '@/lib/premium';
import { createPremiumCheckoutSession, stripeConfigured } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in to upgrade' }, { status: 401 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (userHasPremium(user)) {
    return NextResponse.json({ error: 'Already premium' }, { status: 400 });
  }

  const { STRIPE_SECRET_KEY, STRIPE_PREMIUM_PRICE_ID, APP_URL } = await getBindings();

  if (!stripeConfigured(STRIPE_SECRET_KEY) || !STRIPE_PREMIUM_PRICE_ID) {
    return NextResponse.json({ error: 'Stripe is not configured yet' }, { status: 503 });
  }

  try {
    const session = await createPremiumCheckoutSession({
      secretKey: STRIPE_SECRET_KEY!,
      priceId: STRIPE_PREMIUM_PRICE_ID,
      appUrl: APP_URL,
      userId: user.id,
      userEmail: user.email,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Checkout URL missing' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
