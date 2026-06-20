'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import {
  checkNativeAppUpdate,
  installNativeAppUpdate,
  isNativeAndroidApp,
  type ReleaseCheckResult,
} from '@/lib/appUpdates';
import { AD_SLOT_ENABLED, PREMIUM_ENABLED } from '@/lib/mobileConfig';
import { cn } from '@/lib/utils';
import { PremiumUpgrade } from '@/components/PremiumUpgrade';
import { useAuth } from '@/components/AuthProvider';

export function MobileShellExtras() {
  const { user } = useAuth();
  const isPremium = Boolean(user?.premium);
  const native = isNativeAndroidApp();
  const [update, setUpdate] = useState<ReleaseCheckResult | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (!native) return;

    let cancelled = false;
    void checkNativeAppUpdate().then((result) => {
      if (!cancelled && result?.updateAvailable) {
        setUpdate(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [native]);

  const installUpdate = useCallback(async () => {
    if (!update?.downloadUrl) return;
    setInstalling(true);
    await installNativeAppUpdate(update.downloadUrl);
    setInstalling(false);
  }, [update]);

  if (!native && !AD_SLOT_ENABLED && !(PREMIUM_ENABLED && !isPremium)) return null;

  return (
    <>
      {native && update && !dismissed && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-violet-500/30 bg-[#120a1f]/95 px-3 py-3 backdrop-blur-xl sm:px-4">
          <div className="mx-auto flex max-w-6xl items-start gap-3">
            <Download className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-violet-200">
                Update ready · {update.latestVersionName}
              </p>
              <p className="mt-0.5 text-[11px] text-stone-400">
                Install the latest shell from GitHub. Your bets stay synced in the cloud.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void installUpdate()}
                  disabled={installing}
                  className="rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-violet-500 disabled:opacity-60"
                >
                  {installing ? 'Starting…' : 'Install update'}
                </button>
                {update.releasePageUrl && (
                  <a
                    href={update.releasePageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-stone-300"
                  >
                    Release notes
                  </a>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-md p-1 text-stone-500 hover:text-stone-300"
              aria-label="Dismiss update banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {AD_SLOT_ENABLED && !isPremium && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-stone-950/95 px-3 py-2 text-center backdrop-blur md:bottom-auto md:top-[72px] md:border-b md:border-t-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-600">Ad space</p>
          <p className="text-[11px] text-stone-500">Banner placeholder · wire up AdMob in docs/ADS.md</p>
        </div>
      )}

      {PREMIUM_ENABLED && !isPremium && (
        <PremiumUpgrade className="fixed bottom-16 right-3 z-40 max-w-[11rem]" />
      )}
    </>
  );
}

export function MobileSafeAreaPadding({ enabled }: { enabled: boolean }) {
  return (
    <div
      className={cn(enabled && 'pb-24')}
      aria-hidden={!enabled}
    />
  );
}
