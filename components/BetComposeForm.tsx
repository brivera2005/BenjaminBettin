'use client';

import { useState } from 'react';
import { Check, ChevronDown, Copy, Trash2, X } from 'lucide-react';
import { calculateBetResult, formatCurrency } from '@/lib/betMath';
import type { Bet, BetInput, BetOutcome } from '@/lib/types';
import { cn } from '@/lib/utils';

const OUTCOMES: { value: BetOutcome; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'win', label: 'Win' },
  { value: 'loss', label: 'Loss' },
  { value: 'push', label: 'Push' },
];

function outcomeStyles(outcome: BetOutcome) {
  switch (outcome) {
    case 'win':
      return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'loss':
      return 'text-red-400 bg-red-400/10 border-red-400/20';
    case 'push':
      return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    default:
      return 'text-violet-300 bg-violet-500/10 border-violet-500/20';
  }
}

export interface ComposeValues {
  bet_date: string;
  bet: string;
  wager: number;
  odds: string;
  outcome: BetOutcome;
}

const WAGER_PRESETS = [25, 50, 100, 200, 500];
const ODDS_PRESETS = ['-110', '+100', '-120', '+150'];

interface BetComposeFormProps {
  title: string;
  initial: ComposeValues;
  onSave: (values: ComposeValues) => void;
  onCancel: () => void;
  onDelete?: () => void;
  repeatFrom?: ComposeValues | null;
}

export function BetComposeForm({
  title,
  initial,
  onSave,
  onCancel,
  onDelete,
  repeatFrom,
}: BetComposeFormProps) {
  const [values, setValues] = useState(initial);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const result = calculateBetResult(values.wager, values.odds, values.outcome);

  const applyRepeat = () => {
    if (!repeatFrom) return;
    setValues({
      ...values,
      bet: repeatFrom.bet,
      wager: repeatFrom.wager,
      odds: repeatFrom.odds,
      outcome: 'pending',
    });
  };

  return (
    <article className="mb-3 rounded-2xl border border-violet-500/30 bg-surface-strong p-4 shadow-lg shadow-violet-900/20">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-violet-300">{title}</h3>
        <div className="flex gap-1">
          {repeatFrom && (
            <button
              type="button"
              onClick={applyRepeat}
              className="flex h-8 items-center gap-1 rounded-lg px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-hover hover:text-violet-300"
              title="Copy last bet details"
            >
              <Copy className="h-3.5 w-3.5" />
              Repeat
            </button>
          )}
          {onDelete && !confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-red-500/10 hover:text-red-400"
              aria-label="Delete bet"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {onDelete && confirmDelete && (
            <>
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg bg-red-500/20 px-2 text-[10px] font-bold uppercase text-red-400 hover:bg-red-500/30"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg px-2 text-[10px] font-bold uppercase text-stone-500 hover:text-stone-300"
              >
                Cancel
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-hover hover:text-heading"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <input
          type="date"
          value={values.bet_date}
          onChange={(e) => setValues({ ...values, bet_date: e.target.value })}
          className="w-full rounded-xl border border-border-default bg-surface-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-violet-500/40"
        />
        <input
          type="text"
          value={values.bet}
          placeholder="Yankees -1.5"
          onChange={(e) => setValues({ ...values, bet: e.target.value })}
          className="w-full rounded-xl border border-border-default bg-surface-input px-3 py-3 text-base font-medium text-foreground outline-none placeholder:text-muted-foreground focus:border-violet-500/40"
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-stone-600">
              Wager
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={values.wager || ''}
                onChange={(e) =>
                  setValues({ ...values, wager: Number.parseFloat(e.target.value) || 0 })
                }
                className="w-full rounded-xl border border-border-default bg-surface-input py-2.5 pl-7 pr-3 text-sm tabular-nums outline-none focus:border-violet-500/40"
              />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {WAGER_PRESETS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setValues({ ...values, wager: amount })}
                  className={cn(
                    'rounded-md border px-2 py-0.5 text-[10px] font-bold tabular-nums transition',
                    values.wager === amount
                      ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                      : 'border-border-subtle text-muted-foreground hover:border-border-default hover:text-foreground'
                  )}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-stone-600">
              Odds
            </span>
            <input
              type="text"
              value={values.odds}
              onChange={(e) => setValues({ ...values, odds: e.target.value })}
              className="w-full rounded-xl border border-border-default bg-surface-input px-3 py-2.5 text-sm font-semibold tabular-nums text-emerald-400 outline-none focus:border-violet-500/40"
            />
            <div className="mt-1.5 flex flex-wrap gap-1">
              {ODDS_PRESETS.map((odds) => (
                <button
                  key={odds}
                  type="button"
                  onClick={() => setValues({ ...values, odds })}
                  className={cn(
                    'rounded-md border px-2 py-0.5 text-[10px] font-bold tabular-nums transition',
                    values.odds === odds
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-border-subtle text-muted-foreground hover:border-border-default hover:text-foreground'
                  )}
                >
                  {odds}
                </button>
              ))}
            </div>
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-stone-600">
            Outcome
          </span>
          <div className="relative">
            <select
              value={values.outcome}
              onChange={(e) =>
                setValues({ ...values, outcome: e.target.value as BetOutcome })
              }
              className={cn(
                'w-full appearance-none rounded-xl border px-3 py-2.5 pr-8 text-sm font-semibold outline-none',
                outcomeStyles(values.outcome)
              )}
            >
              {OUTCOMES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
          </div>
        </label>
        {values.outcome !== 'pending' && (
          <p className="text-center text-sm font-semibold tabular-nums text-stone-400">
            Result: {formatCurrency(result)}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onSave(values)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white transition hover:bg-violet-500 active:scale-[0.99]"
      >
        <Check className="h-4 w-4" />
        Save Bet
      </button>
    </article>
  );
}

export function betToCompose(bet: Bet): ComposeValues {
  return {
    bet_date: bet.bet_date,
    bet: bet.bet,
    wager: bet.wager,
    odds: bet.odds,
    outcome: bet.outcome,
  };
}

export function composeToInput(values: ComposeValues): BetInput {
  return {
    bet_date: values.bet_date,
    bet: values.bet,
    wager: values.wager,
    odds: values.odds,
    outcome: values.outcome,
  };
}
