'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, ExternalLink, KeyRound, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OddsApiSettings {
  configured: boolean;
  source: 'user' | 'server' | null;
  userKeySaved: boolean;
  hint: string | null;
  serverFallbackAvailable: boolean;
}

interface SettingsViewProps {
  onSaved?: () => void;
}

export function SettingsView({ onSaved }: SettingsViewProps) {
  const [settings, setSettings] = useState<OddsApiSettings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/settings/odds-api', { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not load settings');
      const data = (await response.json()) as OddsApiSettings;
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveKey = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/settings/odds-api', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = (await response.json()) as { error?: string; hint?: string };
      if (!response.ok) throw new Error(data.error ?? 'Save failed');

      setApiKey('');
      setSuccess('API key saved and verified.');
      await load();
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const removeKey = async () => {
    setRemoving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/settings/odds-api', { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not remove key');
      setSuccess('Your personal key was removed.');
      await load();
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500/70" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <section className="rounded-2xl border border-white/5 bg-stone-900/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-bold text-stone-100">Odds API</h2>
        </div>

        <p className="text-[11px] leading-relaxed text-stone-500">
          Auto-grade uses{' '}
          <a
            href="https://the-odds-api.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-violet-400 hover:text-violet-300"
          >
            The Odds API
            <ExternalLink className="h-3 w-3" />
          </a>{' '}
          to pull finished game scores. Free tier is 500 credits/month — plenty for personal use.
        </p>

        <div className="mt-3 rounded-xl border border-white/5 bg-stone-950/40 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-600">Status</p>
          <p className="mt-1 text-sm font-medium text-stone-200">
            {settings?.configured ? (
              <>
                Connected
                {settings.hint && (
                  <span className="ml-1 font-normal text-stone-500">({settings.hint})</span>
                )}
              </>
            ) : (
              'Not configured'
            )}
          </p>
          <p className="mt-0.5 text-[10px] text-stone-600">
            {settings?.source === 'user' && 'Using your personal key'}
            {settings?.source === 'server' && 'Using app default key'}
            {!settings?.configured && 'Add a key below to enable auto-grade'}
          </p>
        </div>

        <label className="mt-4 block">
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600">
            Your API key
          </span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste key from the-odds-api.com"
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-stone-950/50 px-3 py-2 text-sm text-stone-200 outline-none focus:border-violet-500/40"
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void saveKey()}
            disabled={saving || !apiKey.trim()}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-violet-500 disabled:opacity-50'
            )}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save key
          </button>

          {settings?.userKeySaved && (
            <button
              type="button"
              onClick={() => void removeKey()}
              disabled={removing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-stone-400 transition hover:border-red-500/30 hover:text-red-400 disabled:opacity-50"
            >
              {removing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Remove mine
            </button>
          )}
        </div>

        {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
        {success && <p className="mt-2 text-[11px] text-emerald-400">{success}</p>}

        <p className="mt-3 text-[10px] leading-relaxed text-stone-600">
          Your key is stored on your account only and never shown again after saving. Each auto-grade
          run uses about 12 credits across major sports.
        </p>
      </section>
    </div>
  );
}
