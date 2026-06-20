import { APP_RELEASE } from '@/lib/mobileConfig';

export interface ReleaseCheckResult {
  updateAvailable: boolean;
  currentVersionCode: number;
  latestVersionName?: string;
  latestVersionCode?: number;
  downloadUrl?: string;
  releaseNotes?: string;
  releasePageUrl?: string;
}

export function isNativeAndroidApp(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as Window & {
    Capacitor?: { getPlatform?: () => string; isNativePlatform?: () => boolean };
  }).Capacitor;
  return Boolean(cap?.isNativePlatform?.() && cap.getPlatform?.() === 'android');
}

async function getApkUpdater() {
  const mod = await import('@/plugins/apk-updater/src');
  return mod.ApkUpdater;
}

export async function checkNativeAppUpdate(): Promise<ReleaseCheckResult | null> {
  if (!isNativeAndroidApp()) return null;

  try {
    const ApkUpdater = await getApkUpdater();
    return await ApkUpdater.checkForUpdate({
      githubOwner: APP_RELEASE.githubOwner,
      githubRepo: APP_RELEASE.githubRepo,
      apkAssetName: APP_RELEASE.apkAssetName,
    });
  } catch {
    return null;
  }
}

export async function installNativeAppUpdate(url: string): Promise<boolean> {
  if (!isNativeAndroidApp()) return false;

  try {
    const ApkUpdater = await getApkUpdater();
    const result = await ApkUpdater.downloadAndInstall({ url });
    return result.started;
  } catch {
    return false;
  }
}

export async function getNativeAppVersion(): Promise<{ versionName: string; versionCode: number } | null> {
  if (!isNativeAndroidApp()) return null;

  try {
    const ApkUpdater = await getApkUpdater();
    return await ApkUpdater.getAppVersion();
  } catch {
    return null;
  }
}
