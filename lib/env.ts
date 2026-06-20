import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function getBindings(): Promise<CloudflareEnv> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env as CloudflareEnv;
  } catch {
    return {
      DB: null as unknown as D1Database,
      ASSETS: null as unknown as Fetcher,
      WORKER_SELF_REFERENCE: null as unknown as Fetcher,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',
      AUTH_SECRET: process.env.AUTH_SECRET ?? '',
      APP_URL: process.env.APP_URL ?? 'http://localhost:3000',
      ODDS_API_KEY: process.env.ODDS_API_KEY ?? '',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? '',
      STRIPE_PREMIUM_PRICE_ID: process.env.STRIPE_PREMIUM_PRICE_ID ?? '',
    };
  }
}
