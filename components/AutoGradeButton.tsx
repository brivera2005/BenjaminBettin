'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutoGradeButtonProps {
  pendingCount: number;
  configRefreshKey?: number;
  onGraded: (payload: {
    graded: number;
    skipped: number;
    results: GradeResultItem[];
  }) => void;
  onError: (message: string) => void;
}

export interface GradeResultItem {
  betId: string;
  bet: string;
  outcome: string | null;
  reason: string;
  matchedGame?: string;
}

export function AutoGradeButton({
  pendingCount,
  configRefreshKey = 0,
  onGraded,
  onError,
}: AutoGradeButtonProps) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastResults, setLastResults] = useState<GradeResultItem[] | null>(null);

  useEffect(() => {
    fetch('/api/bets/auto-grade')
      .then((r) => r.json() as Promise<{ configured: boolean }>)
      .then((d) => setConfigured(d.configured))
      .catch(() => setConfigured(false));
  }, [configRefreshKey]);

  const run = useCallback(async () => {
    setLoading(true);
    setLastResults(null);
    try {
      const response = await fetch('/api/bets/auto-grade', { method: 'POST' });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
        graded?: number;
        skipped?: number;
        results?: GradeResultItem[];
      };

      if (!response.ok) {
        onError(data.message ?? data.error ?? 'Auto-grade failed');
        return;
      }

      const payload = {
        graded: data.graded ?? 0,
        skipped: data.skipped ?? 0,
        results: data.results ?? [],
      };
      setLastResults(payload.results.filter((r) => r.outcome));
      onGraded(payload);
    } catch {
      onError('Could not reach grading service');
    } finally {
      setLoading(false);
    }
  }, [onGraded, onError]);

  if (pendingCount === 0) return null;

  return (
    <div className="mb-3 space-y-2">
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading || configured === false}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-[11px] font-bold uppercase tracking-widest transition active:scale-[0.99]',
          configured === false
            ? 'border-border-subtle bg-surface text-muted-foreground'
            : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15',
          loading && 'opacity-60'
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {loading
          ? 'Checking scores…'
          : `Auto-grade ${pendingCount} pending`}
      </button>

      {configured === false && (
        <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
          Add your Odds API key in the <span className="text-violet-400">Settings</span> tab to
          enable score lookups.
        </p>
      )}

      {configured !== false && pendingCount > 0 && (
        <p className="text-center text-[10px] text-muted-foreground">
          Use team name + ML / spread / O / U — auto-grade matches scores for you.
        </p>
      )}

      {lastResults && lastResults.length > 0 && (
        <ul className="rounded-lg border border-border-subtle bg-surface px-2 py-1.5 text-[10px] text-muted-foreground">
          {lastResults.slice(0, 5).map((r) => (
            <li key={r.betId} className="truncate">
              <span
                className={cn(
                  'font-bold uppercase',
                  r.outcome === 'win' && 'text-emerald-400',
                  r.outcome === 'loss' && 'text-red-400',
                  r.outcome === 'push' && 'text-yellow-400'
                )}
              >
                {r.outcome}
              </span>{' '}
              · {r.bet}
              {r.matchedGame && (
                <span className="text-stone-600"> ({r.matchedGame})</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
