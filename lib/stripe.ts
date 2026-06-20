const STRIPE_API_BASE = 'https://api.stripe.com/v1';

export interface StripeCheckoutSession {
  id: string;
  url: string | null;
  payment_status: string;
  client_reference_id: string | null;
  metadata?: Record<string, string>;
  customer_email?: string | null;
}

export interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: StripeCheckoutSession;
  };
}

function encodeFormBody(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

export function stripeConfigured(secretKey: string | undefined): boolean {
  return Boolean(secretKey?.startsWith('sk_') || secretKey?.startsWith('rk_'));
}

export async function createPremiumCheckoutSession(options: {
  secretKey: string;
  priceId: string;
  appUrl: string;
  userId: string;
  userEmail: string;
}): Promise<StripeCheckoutSession> {
  const body = encodeFormBody({
    mode: 'payment',
    'line_items[0][price]': options.priceId,
    'line_items[0][quantity]': '1',
    success_url: `${options.appUrl}/?premium=success`,
    cancel_url: `${options.appUrl}/?premium=cancel`,
    client_reference_id: options.userId,
    customer_email: options.userEmail,
    'metadata[user_id]': options.userId,
    'metadata[product]': 'bettin-premium',
  });

  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2026-05-27.dahlia',
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stripe checkout failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as StripeCheckoutSession;
}

export async function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string | null,
  webhookSecret: string
): Promise<boolean> {
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key.trim(), value];
    })
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expected = bufferToHex(digest);

  return timingSafeEqual(expected, signature);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function parseStripeEvent(payload: string): StripeEvent {
  return JSON.parse(payload) as StripeEvent;
}
