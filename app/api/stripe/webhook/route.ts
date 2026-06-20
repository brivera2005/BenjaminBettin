import { NextResponse } from 'next/server';
import {
  grantPremiumFromStripe,
  isStripeCheckoutSessionProcessed,
} from '@/lib/db';
import { getBindings } from '@/lib/env';
import { parseStripeEvent, verifyStripeWebhookSignature } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');
  const { STRIPE_WEBHOOK_SECRET } = await getBindings();

  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  const valid = await verifyStripeWebhookSignature(payload, signature, STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = parseStripeEvent(payload);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true, skipped: 'unpaid' });
    }

    if (await isStripeCheckoutSessionProcessed(session.id)) {
      return NextResponse.json({ received: true, skipped: 'duplicate' });
    }

    const userId = session.metadata?.user_id ?? session.client_reference_id;
    if (!userId) {
      return NextResponse.json({ error: 'Missing user id on session' }, { status: 400 });
    }

    await grantPremiumFromStripe(userId, session.id);
  }

  return NextResponse.json({ received: true });
}
