'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Check } from 'lucide-react';
import type { ComposeValues } from '@/components/BetComposeForm';
import type { DailyProfitEntry } from '@/lib/betStats';
import { BetDayPlCell } from '@/components/BetDayPlCell';
import {
  betRowDateWidth,
  betRowEditWidth,
  betRowOddsWidth,
  betRowStatusWidth,
  betRowWagerWidth,
  compactInputClass,
} from '@/components/betRowShared';
import { useDisplayMode } from '@/components/DisplayModeContext';
import {
  formatBetDescription,
  isParlayLike,
  parseBetDescription,
} from '@/lib/betParse';
import { formatShortDate } from '@/lib/weekUtils';
import { cn } from '@/lib/utils';

export interface BetQuickAddRowHandle {
  focus: () => void;
}

interface BetQuickAddRowProps {
  betDate: string;
  defaults: { wager: number; odds: string };
  dailyProfitByDate: Map<string, DailyProfitEntry>;
  onSave: (values: ComposeValues) => void | Promise<void>;
}

const quickAddFieldClass = cn(
  compactInputClass,
  'transition-colors hover:border-border-default hover:bg-surface-strong'
);

function buildBetDescription(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (isParlayLike(trimmed)) return trimmed;

  const parsed = parseBetDescription(trimmed);
  if (parsed.market !== 'ml' || parsed.line !== undefined || parsed.teamTotal) {
    return formatBetDescription(
      parsed.teamHint,
      parsed.market,
      parsed.line,
      parsed.teamTotal
    );
  }
  if (/\bml\b/i.test(trimmed)) return trimmed;
  return formatBetDescription(parsed.teamHint || trimmed, 'ml');
}

export const BetQuickAddRow = forwardRef<BetQuickAddRowHandle, BetQuickAddRowProps>(
  function BetQuickAddRow({ betDate, defaults, dailyProfitByDate, onSave }, ref) {
    const { units, unitSize } = useDisplayMode();
    const teamRef = useRef<HTMLInputElement>(null);
    const [selectedDate, setSelectedDate] = useState(betDate);
    const [team, setTeam] = useState('');
    const [wagerInput, setWagerInput] = useState('');
    const [oddsInput, setOddsInput] = useState('');

    useEffect(() => {
      setSelectedDate(betDate);
    }, [betDate]);

    const reset = useCallback(() => {
      setTeam('');
      setWagerInput('');
      setOddsInput('');
    }, []);

    useImperativeHandle(ref, () => ({
      focus: () => teamRef.current?.focus(),
    }));

    const submit = async () => {
      const bet = buildBetDescription(team);
      const wager = wagerInput.trim()
        ? Number.parseFloat(wagerInput) || 0
        : defaults.wager;
      const odds = oddsInput.trim() || defaults.odds;
      if (!bet.trim() && wager <= 0) return;
      await onSave({
        bet_date: selectedDate,
        bet,
        wager,
        odds,
        outcome: 'pending',
      });
      reset();
      teamRef.current?.focus();
    };

    const wagerDisplay = units
      ? wagerInput.trim()
        ? String(Math.round(Number.parseFloat(wagerInput) / unitSize))
        : ''
      : wagerInput;

    const dayProfit = dailyProfitByDate.get(selectedDate);

    return (
      <div className="border-b border-violet-500/25 bg-violet-500/[0.06]">
        <div className="flex items-center gap-1 px-1 py-1.5 text-[11px] leading-tight sm:gap-1.5 sm:px-2 sm:text-xs">
          <label
            className={cn(
              quickAddFieldClass,
              betRowDateWidth,
              'relative flex cursor-pointer items-center justify-center tabular-nums text-stone-500'
            )}
            title="Tap to change date"
          >
            {formatShortDate(selectedDate)}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Bet date"
            />
          </label>

          <input
            ref={teamRef}
            type="text"
            value={team}
            placeholder="Yankees ML"
            onChange={(e) => setTeam(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit();
            }}
            className={cn(quickAddFieldClass, 'min-w-0 flex-1 font-medium')}
          />

          <input
            type="number"
            min="0"
            step="1"
            value={wagerDisplay}
            placeholder="$"
            onChange={(e) => {
              const raw = e.target.value;
              if (units) {
                setWagerInput(raw.trim() ? String(Number.parseFloat(raw) * unitSize) : '');
              } else {
                setWagerInput(raw);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit();
            }}
            className={cn(quickAddFieldClass, betRowWagerWidth, 'tabular-nums')}
            aria-label={units ? 'Wager (units)' : 'Wager'}
          />

          <input
            type="text"
            value={oddsInput}
            placeholder="Odds"
            onChange={(e) => setOddsInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit();
            }}
            className={cn(
              quickAddFieldClass,
              betRowOddsWidth,
              'text-right tabular-nums text-emerald-500/90 placeholder:text-stone-600'
            )}
            aria-label="Odds"
          />

          <span className={betRowStatusWidth} aria-hidden />

          <BetDayPlCell entry={dayProfit} />

          <button
            type="button"
            onClick={() => void submit()}
            className={cn(
              betRowEditWidth,
              'flex h-6 items-center justify-center rounded-md bg-violet-600 text-white transition hover:bg-violet-500 active:scale-95'
            )}
            aria-label="Save bet"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }
);
