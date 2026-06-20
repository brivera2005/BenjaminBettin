# Premium ($9.99 one-time)

Premium is **planned, not wired yet**. Sideloaded APKs cannot use Google Play Billing — use one of these instead.

## Recommended: Stripe Payment Link + license flag

Best fit for a personal app distributed outside the Play Store.

### Flow

1. Create a [Stripe Payment Link](https://dashboard.stripe.com/payment-links) for **$9.99 one-time**.
2. After payment, Stripe webhook hits your Cloudflare Worker.
3. Worker sets `premium: true` on the user row in D1.
4. App reads `/api/auth/me` → hides ads + unlocks premium UI.

### What premium should include

- No ads
- Extra stats (CLV tracker, sport breakdown, export CSV)
- Custom unit size (not just $10)
- Optional: priority auto-grade queue

### Env flags (scaffold)

```env
NEXT_PUBLIC_PREMIUM_ENABLED=true
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
```

### Upgrade button

`components/MobileShellExtras.tsx` has a stub **Upgrade** button. Wire it to:

```typescript
window.open('https://buy.stripe.com/your-link', '_blank');
```

Then poll `/api/auth/me` after return.

## Alternative: Lemon Squeezy

Similar to Stripe — hosted checkout + webhook. Good if you want license keys emailed automatically.

## Alternative: Manual license key

Simplest for solo use:

1. User pays you via Venmo/Cash App.
2. You set a `premium_until` or `is_premium` flag in D1 for their Google email.

## Pricing note

**$9.99 one-time** is fair for a personal power tool. Consider **$4.99** if you want more conversions, or **$14.99** if you add pro analytics later. One-time beats subscription for bet trackers — people hate another monthly sub.

## Play Store path (future)

If you ever publish to Google Play, swap to Google Play Billing and restore purchases by Google account.
