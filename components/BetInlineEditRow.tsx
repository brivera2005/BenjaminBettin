'use client';

import { useState } from 'react';
import { Check, Trash2, X } from 'lucide-react';
import type { ComposeValues } from '@/components/BetComposeForm';
import {
  betRowBetInputClass,
  betRowLayoutClass,
  compactInputClass,
  cycleOutcome,
  OutcomePill,
  betRowWagerOddsClass,
} from '@/components/betRowShared';
import { useDisplayMode } from '@/components/DisplayModeContext';
import type { BetOutcome } from '@/lib/types';
import { cn } from '@/lib/utils';

interface BetInlineEditRowProps {
  initial: ComposeValues;
  onSave: (values: ComposeValues) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function BetInlineEditRow({ initial, onSave, onCancel, onDelete }: BetInlineEditRowProps) {
  const { units, unitSize } = useDisplayMode();
  const [values, setValues] = useState(initial);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const wagerDisplay = units
    ? values.wager
      ? String(Math.round(values.wager / unitSize))
      : ''
    : values.wager || '';

  return (
    <div className={cn(betRowLayoutClass, 'border-b border-amber-500/20 bg-amber-500/[0.04]')}>
      <input
        type="date"
        value={values.bet_date}
        onChange={(e) => setValues({ ...values, bet_date: e.target.value })}
        className={`${compactInputClass} w-[4.25rem] shrink-0 tabular-nums sm:w-[5.5rem]`}
      />

      <input
        type="text"
        value={values.bet}
        onChange={(e) => setValues({ ...values, bet: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave(values);
          if (e.key === 'Escape') onCancel();
        }}
        className={cn(compactInputClass, betRowBetInputClass)}
        autoFocus
      />

      <input
        type="number"
        min="0"
        step="1"
        value={wagerDisplay}
        onChange={(e) => {
          const raw = Number.parseFloat(e.target.value) || 0;
          setValues({ ...values, wager: units ? raw * unitSize : raw });
        }}
        className={`${compactInputClass} w-9 shrink-0 tabular-nums sm:w-11 ${betRowWagerOddsClass}`}
        aria-label={units ? 'Wager (units)' : 'Wager'}
      />

      <input
        type="text"
        value={values.odds}
        onChange={(e) => setValues({ ...values, odds: e.target.value })}
        className={`${compactInputClass} w-9 shrink-0 text-right sm:w-11 ${betRowWagerOddsClass}`}
        aria-label="Odds"
      />

      <OutcomePill
        outcome={values.outcome}
        onClick={() =>
          setValues({ ...values, outcome: cycleOutcome(values.outcome) as BetOutcome })
        }
      />

      <span className="w-6 shrink-0" />

      {confirmDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="flex h-6 shrink-0 items-center rounded-md bg-red-500/20 px-1.5 text-[9px] font-bold text-red-400"
        >
          Del
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-red-500 dark:hover:text-red-400"
          aria-label="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}

      <button
        type="button"
        onClick={onCancel}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-hover"
        aria-label="Cancel"
      >
        <X className="h-3 w-3" />
      </button>

      <button
        type="button"
        onClick={() => onSave(values)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-600 text-white hover:bg-violet-500 active:scale-95"
        aria-label="Save"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
