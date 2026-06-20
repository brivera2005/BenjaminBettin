import releaseMeta from '@/mobile/release.json';

export const APP_RELEASE = releaseMeta;

export const PRODUCTION_URL = 'https://benjamin-bettin.brivera2005.workers.dev';

export const PREMIUM_PRICE_LABEL = '$9.99 one-time';

export const AD_SLOT_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true';

export const PREMIUM_ENABLED = process.env.NEXT_PUBLIC_PREMIUM_ENABLED === 'true';
