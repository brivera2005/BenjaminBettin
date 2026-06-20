# Ads setup (AdMob)

Ads are **scaffolded but off by default**. The app shows a placeholder banner when enabled.

## Why AdMob

Works in sideloaded APKs (no Play Store required). Good fit for a free tier with premium upsell.

## Steps

### 1. Create AdMob account

1. Go to [admob.google.com](https://admob.google.com).
2. Add an app → **Android** → package name: `com.benjaminbettin.app`.
3. Create ad units:
   - **Banner** (bottom of Bets tab)
   - Optional **Interstitial** (after every N bet saves — use sparingly)

### 2. Install Capacitor AdMob plugin

```bash
npm install @capacitor-community/admob
npx cap sync android
```

### 3. Add `google-services.json`

1. Firebase console → add Android app with same package ID.
2. Download `google-services.json` → `android/app/google-services.json`.
3. Rebuild APK.

### 4. Wire the banner

Replace the placeholder in `components/MobileShellExtras.tsx` with AdMob banner calls (only when `!isPremium`).

### 5. Enable in env

```env
NEXT_PUBLIC_ADS_ENABLED=true
```

Redeploy web + rebuild APK when native AdMob code lands.

## Premium users

When premium is active (`premium: true` on `/api/auth/me`), skip all ad initialization and hide the banner slot entirely.

Grandfathered owner emails are listed in `lib/premium.ts` and flagged in D1 via migration `0002_premium.sql`.

## Revenue expectations

Sports bet trackers are niche. Banner + optional interstitial on free tier is reasonable. Keep ads below the bet list so logging stays fast.
