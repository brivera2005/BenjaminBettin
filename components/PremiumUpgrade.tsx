'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { PREMIUM_PRICE_LABEL } from '@/lib/mobileConfig';
import { cn } from '@/lib/utils';

interface PremiumUpgradeProps {
  variant?: 'card' | 'button' | 'banner';
  className?: string;
}

export function PremiumUpgrade({ variant = 'card', className }: PremiumUpgradeProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || user.premium) return null;

  const startCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? 'Could not start checkout');
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setLoading(false);
    }
  };

  if (variant === 'button') {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => void startCheckout()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-violet-500 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Upgrade · {PREMIUM_PRICE_LABEL}
        </button>
        {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2',
          className
        )}
      >
        <div>
          <p className="text-[11px] font-bold text-violet-200">Go Premium</p>
          <p className="text-[10px] text-stone-400">
            No ads · pro stats · {PREMIUM_PRICE_LABEL}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void startCheckout()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-violet-500 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Upgrade'}
        </button>
        {error && <p className="w-full text-[10px] text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-violet-500/25 bg-violet-500/10 p-3 shadow-lg shadow-violet-950/40 backdrop-blur',
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-violet-200">
        <Sparkles className="h-3.5 w-3.5" />
        <p className="text-[11px] font-bold uppercase tracking-wide">Go Premium</p>
      </div>
      <p className="mt-1 text-[10px] leading-snug text-stone-400">
        Remove ads and unlock pro stats for {PREMIUM_PRICE_LABEL}.
      </p>
      <button
        type="button"
        onClick={() => void startCheckout()}
        disabled={loading}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-violet-500 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Upgrade'}
      </button>
      {error && <p className="mt-1.5 text-[10px] text-red-400">{error}</p>}
    </div>
  );
}
