# Bettin' — Sports Bet Tracker

**Live app:** https://benjamin-bettin.brivera2005.workers.dev  
**Android:** sideload APK via [GitHub Releases](https://github.com/brivera2005/BenjaminBettin/releases) (see [docs/ANDROID.md](docs/ANDROID.md))

A fast, dark-mode bet tracker built for logging slips in seconds — compact rows, week pagination, auto-grade, and unit view for bankroll nerds.

---

## Name

| Name | Vibe |
|------|------|
| **BenjaminBettin** | Personal, repo/domain name — great for you |
| **Bettin'** | Public app name on the icon — short, memorable, slightly cocky ✓ |
| UnitLog / EdgeLedger | Generic if you ever productize |

**Recommendation:** keep **BenjaminBettin** as the GitHub repo, ship the phone icon as **Bettin'**.

---

## Features

### Bet logging
- One-line **quick add** — ML, spread, O/U, team total, parlay (`Prl`)
- **Parlay paste** — full slip text saved as-is (manual grade)
- **Compact rows** — date, bet, wager, odds, outcome, P/L
- **Week pagination** — swipe older/newer weeks, jump to current week
- **Sort by risk** — highest wager first within each day
- **Repeat last bet** — one tap to clone wager/odds

### Grading
- **Auto-grade** — ML, spread, game total, team total via The Odds API
- **Yellow highlight** — parlays, props, F5, anything auto-grade can't handle
- Tap outcome pill: Pending → Win → Loss → Push

### Stats
- **Running total** with settled / W / L / win%
- **Tap total** → toggle **$ ↔ units** ($10 unit size, rounded)
- **Daily recaps** — Last 10, Last 5, Yesterday
- **History tab** — cumulative chart, monthly bars, monthly summary
- **Prior profit baseline** baked into all-time total (config in `lib/baseline.ts`)

### Account
- Google Sign-In
- Per-user bets on Cloudflare D1
- Optimistic UI — edits feel instant

### Android app
- Native shell (Capacitor) — home screen icon, splash, status bar
- Loads live Cloudflare app (most updates = no reinstall)
- **In-app updater** — checks GitHub Releases for new APK shell
- Ad + premium placeholders ready (see docs below)

---

## Stack

| Layer | Tech |
|-------|------|
| Web | Next.js 16, React 19, Tailwind 4 |
| Host | Cloudflare Workers + D1 |
| Auth | Google OAuth, `jose` sessions |
| Mobile | Capacitor 8 (Android) |
| Scores | The Odds API |

---

## Quick start (web)

```bash
npm install
cp .env.example .env.local   # GOOGLE_*, AUTH_SECRET, APP_URL, ODDS_API_KEY
npm run db:migrate:local
npm run preview              # http://localhost:8787
```

Deploy:

```bash
npm run deploy
```

Full setup: Google OAuth redirect URIs, Wrangler secrets — see sections below in this file or `.env.example`.

---

## Android APK (your phone)

```bash
npm run mobile:sync
npm run mobile:open          # opens Android Studio
```

Build APK in Android Studio, or push a tag and GitHub builds it:

```bash
# bump mobile/release.json versionCode first
git tag android-v1.0.0-build1
git push origin android-v1.0.0-build1
```

📖 **[docs/ANDROID.md](docs/ANDROID.md)** — install, updates, signing  
📖 **[docs/ADS.md](docs/ADS.md)** — AdMob setup  
📖 **[docs/PREMIUM.md](docs/PREMIUM.md)** — $9.99 one-time premium via Stripe  

---

## Two update channels

| What changed | How users get it |
|--------------|------------------|
| UI, bets, auto-grade, stats | `npm run deploy` → instant in browser + app |
| Native shell, ads SDK, billing | New GitHub Release APK → in-app **Install update** banner |

---

## Bet semantics

| Entry | Meaning |
|-------|---------|
| `Yankees ML` | Moneyline |
| `Yankees +1.5` | Spread |
| `Yankees O9.5` | **Game** total |
| `Yankees TT O4.5` | **Team** total |
| `Yankees -1.5, Mets ML, …` | Parlay (manual grade) |

---

## American odds P/L

- **Win (+140):** profit = wager × (odds / 100)
- **Win (-110):** profit = wager / (|odds| / 100)
- **Loss:** −wager
- **Push / Pending:** $0

---

## Project structure

```
app/              Next.js routes + API
components/       UI (BetTracker, charts, mobile shell)
lib/              bet math, parse, auto-grade, D1, mobile config
mobile/           Capacitor web fallback + release.json
plugins/          apk-updater (GitHub in-app updates)
android/          Capacitor Android project
docs/             ANDROID, ADS, PREMIUM guides
migrations/       D1 SQL
```

---

## Deploy to Cloudflare (detail)

### Secrets

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put AUTH_SECRET
npx wrangler secret put APP_URL
npx wrangler secret put ODDS_API_KEY
```

### Migrations

```bash
npm run db:migrate:remote
npm run deploy
```

---

## License

Private — personal bet tracker.
