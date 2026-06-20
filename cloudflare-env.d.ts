interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  WORKER_SELF_REFERENCE: Fetcher;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  AUTH_SECRET: string;
  APP_URL: string;
  ODDS_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PREMIUM_PRICE_ID?: string;
}
