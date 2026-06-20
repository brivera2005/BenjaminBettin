import { registerPlugin } from '@capacitor/core';
import type { ApkUpdaterPlugin } from './definitions';

export * from './definitions';

export const ApkUpdater = registerPlugin<ApkUpdaterPlugin>('ApkUpdater', {
  web: () => import('./web').then((m) => new m.ApkUpdaterWeb()),
});
