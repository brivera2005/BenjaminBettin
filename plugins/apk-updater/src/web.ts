import { WebPlugin } from '@capacitor/core';
import type { AppVersionInfo, ApkUpdaterPlugin, ReleaseCheckResult } from './definitions';

export class ApkUpdaterWeb extends WebPlugin implements ApkUpdaterPlugin {
  async getAppVersion(): Promise<AppVersionInfo> {
    return { versionName: 'web', versionCode: 0 };
  }

  async checkForUpdate(): Promise<ReleaseCheckResult> {
    return { updateAvailable: false, currentVersionCode: 0 };
  }

  async downloadAndInstall(): Promise<{ started: boolean }> {
    return { started: false };
  }
}
