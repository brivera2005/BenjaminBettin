export interface AppVersionInfo {
  versionName: string;
  versionCode: number;
}

export interface ReleaseCheckResult {
  updateAvailable: boolean;
  currentVersionCode: number;
  latestVersionName?: string;
  latestVersionCode?: number;
  downloadUrl?: string;
  releaseNotes?: string;
  releasePageUrl?: string;
}

export interface ApkUpdaterPlugin {
  getAppVersion(): Promise<AppVersionInfo>;
  checkForUpdate(options: {
    githubOwner: string;
    githubRepo: string;
    apkAssetName?: string;
  }): Promise<ReleaseCheckResult>;
  downloadAndInstall(options: { url: string }): Promise<{ started: boolean }>;
}
