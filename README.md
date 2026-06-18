# BenjaminBettin — Bet Tracker

A fast, beautiful sports bet tracking app with Google Sign-In and per-user persistence on Cloudflare D1.

## Features

- **Bet log** — Date, Bet, Wager, Odds, Outcome, Result with inline editing
- **Running total** — Sticky P/L banner using American odds math (win / loss / push)
- **Newest first** — New bets appear at the top of the table
- **Google Sign-In** — Each user's bets are stored permanently in D1
- **Optimistic UI** — Edits feel instant; changes sync in the background

## Stack

- Next.js 16 + React 19 + Tailwind CSS 4
- Cloudflare Workers (via `@opennextjs/cloudflare`)
- Cloudflare D1 (SQLite)
- Google OAuth 2.0 + signed session cookies (`jose`)

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example files and fill in your values:

```bash
cp .env.example .env.local
cp .dev.vars.example .dev.vars
```

Required variables:

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `AUTH_SECRET` | Random 32+ char string for session signing |
| `APP_URL` | App origin (must match OAuth redirect) |

### 3. Google Cloud Console setup

1. Create a project at [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Google+ API** / **Google Identity** (OAuth consent screen)
3. Create **OAuth 2.0 Client ID** (Web application)
4. Add authorized redirect URI:
   - Local preview: `http://localhost:8787/auth/callback`
   - Production: `https://<your-domain>/auth/callback`

### 4. Run database migrations (local D1)

```bash
npm run db:migrate:local
```

### 5. Start the app

**Recommended (Cloudflare preview with D1 bindings):**

```bash
npm run preview
```

Opens at `http://localhost:8787`.

**Alternative (Next.js dev — requires `.env.local`):**

```bash
npm run dev
```

Opens at `http://localhost:3000`. Set `APP_URL=http://localhost:3000` and add that redirect URI in Google Console.

## Deploy to Cloudflare

### 1. Log in to Cloudflare

```bash
npx wrangler login
```

### 2. Create the D1 database (first time only)

```bash
npx wrangler d1 create benjamin-bettin-db
```

Copy the returned `database_id` into `wrangler.jsonc` under `d1_databases`.

### 3. Apply remote migrations

```bash
npm run db:migrate:remote
```

### 4. Set production secrets

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put AUTH_SECRET
npx wrangler secret put APP_URL
```

For `APP_URL`, use your production URL (e.g. `https://benjamin-bettin.<account>.workers.dev`).

### 5. Deploy

```bash
npm run deploy
```

Or connect the GitHub repo in the [Cloudflare dashboard](https://dash.cloudflare.com/) → Workers & Pages → Create → Connect to Git, with build command `npm run deploy`.

## Project structure

```
app/
  api/auth/     Google OAuth + session endpoints
  api/bets/     Bet CRUD API
  auth/callback OAuth callback
components/     BetTracker, auth UI
lib/            betting math, D1 helpers, auth
migrations/     D1 SQL schema
```

## American odds P/L

- **Win (positive odds +140):** profit = wager × (odds / 100)
- **Win (negative odds -110):** profit = wager / (|odds| / 100)
- **Loss:** −wager
- **Push / Pending:** $0.00
