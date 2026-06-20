'use client';

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { ComposeValues } from '@/components/BetComposeForm';
import { compactInputClass, cycleOutcome, OutcomePill } from '@/components/betRowShared';
import { useDisplayMode } from '@/components/DisplayModeContext';
import {
  formatBetDescription,
  isParlayLike,
  parseBetDescription,
  type BetMarket,
} from '@/lib/betParse';
import type { BetOutcome } from '@/lib/types';
import { cn } from '@/lib/utils';
import { todayIso } from '@/lib/weekUtils';

export interface BetQuickAddRowHandle {
  focus: () => void;
}

interface BetQuickAddRowProps {
  defaults: { wager: number; odds: string };
  repeatFrom: ComposeValues | null;
  onSave: (values: ComposeValues) => void | Promise<void>;
}

const MARKETS: { id: BetMarket; label: string }[] = [
  { id: 'ml', label: 'ML' },
  { id: 'spread', label: '±' },
  { id: 'over', label: 'O' },
  { id: 'under', label: 'U' },
  { id: 'parlay', label: 'Prl' },
];

export const BetQuickAddRow = forwardRef<BetQuickAddRowHandle, BetQuickAddRowProps>(
  function BetQuickAddRow({ defaults, repeatFrom, onSave }, ref) {
    const { units, unitSize } = useDisplayMode();
    const teamRef = useRef<HTMLInputElement>(null);
    const [market, setMarket] = useState<BetMarket>('ml');
    const [teamTotal, setTeamTotal] = useState(false);
    const [team, setTeam] = useState('');
    const [line, setLine] = useState('');
    const [values, setValues] = useState<Omit<ComposeValues, 'bet' | 'wager' | 'odds'>>(() => ({
      bet_date: todayIso(),
      outcome: 'pending',
    }));
    const [wagerInput, setWagerInput] = useState('');
    const [oddsInput, setOddsInput] = useState('');

    const isParlay = market === 'parlay';
    const needsLine = !isParlay && (market === 'spread' || market === 'over' || market === 'under');
    const isTotal = market === 'over' || market === 'under';

    const reset = useCallback(() => {
      setTeam('');
      setLine('');
      setMarket('ml');
      setTeamTotal(false);
      setWagerInput('');
      setOddsInput('');
      setValues({
        bet_date: todayIso(),
        outcome: 'pending',
      });
    }, []);

    useImperativeHandle(ref, () => ({
      focus: () => teamRef.current?.focus(),
    }));

    const submit = async () => {
      let bet: string;
      if (isParlay || isParlayLike(team)) {
        bet = team.trim();
      } else {
        const lineNum = line.trim() ? Number.parseFloat(line) : undefined;
        bet = formatBetDescription(
          team,
          market,
          lineNum !== undefined && Number.isFinite(lineNum) ? lineNum : undefined,
          teamTotal
        );
      }
      const wager = wagerInput.trim()
        ? Number.parseFloat(wagerInput) || 0
        : defaults.wager;
      const odds = oddsInput.trim() || defaults.odds;
      if (!bet.trim() && wager <= 0) return;
      await onSave({ ...values, bet, wager, odds });
      reset();
      teamRef.current?.focus();
    };

    const applyRepeat = () => {
      if (!repeatFrom) return;
      if (isParlayLike(repeatFrom.bet)) {
        setMarket('parlay');
        setTeam(repeatFrom.bet);
        setLine('');
        setTeamTotal(false);
      } else {
        const parsed = parseBetDescription(repeatFrom.bet);
        setMarket(parsed.market === 'parlay' ? 'parlay' : parsed.market);
        setTeamTotal(parsed.teamTotal);
        setTeam(parsed.market === 'parlay' ? repeatFrom.bet : parsed.teamHint || repeatFrom.bet);
        setLine(parsed.line !== undefined ? String(parsed.line) : '');
      }
      setValues((v) => ({
        ...v,
        outcome: 'pending',
      }));
      setWagerInput(String(repeatFrom.wager));
      setOddsInput(repeatFrom.odds);
      teamRef.current?.focus();
    };

    const wagerDisplay = units
      ? wagerInput.trim()
        ? String(Math.round(Number.parseFloat(wagerInput) / unitSize))
        : ''
      : wagerInput;
    const wagerPlaceholder = units
      ? String(Math.round(defaults.wager / unitSize))
      : String(defaults.wager);

    const preview = isParlay
      ? 'Yankees -1.5, Mets -1.5, Cardinals -1.5'
      : market === 'ml'
        ? 'Yankees ML'
        : market === 'spread'
          ? 'Yankees +1.5'
          : teamTotal
            ? 'Yankees TT O4.5'
            : 'Yankees O9.5 (game total)';

    return (
      <div className="border-b border-violet-500/25 bg-violet-500/[0.06]">
        <div className="flex items-center gap-1 px-1 py-1.5 text-[11px] leading-tight sm:gap-1.5 sm:px-2 sm:text-xs">
          <input
            type="date"
            value={values.bet_date}
            onChange={(e) => setValues({ ...values, bet_date: e.target.value })}
            className={`${compactInputClass} w-[4.25rem] shrink-0 tabular-nums sm:w-[5.5rem]`}
          />

          <input
            ref={teamRef}
            type="text"
            value={team}
            placeholder={isParlay ? 'Yankees -1.5, Mets -1.5…' : 'Yankees'}
            onChange={(e) => setTeam(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit();
            }}
            className={`${compactInputClass} min-w-0 flex-1 font-medium`}
          />

          {needsLine && (
            <input
              type="text"
              inputMode="decimal"
              value={line}
              placeholder={market === 'spread' ? '+1.5' : '9.5'}
              onChange={(e) => setLine(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submit();
              }}
              className={`${compactInputClass} w-10 shrink-0 tabular-nums sm:w-12`}
              aria-label="Line"
            />
          )}

          <input
            type="number"
            min="0"
            step="1"
            value={wagerDisplay}
            placeholder={wagerPlaceholder}
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
            className={`${compactInputClass} w-9 shrink-0 tabular-nums sm:w-11`}
            aria-label={units ? 'Wager (units)' : 'Wager'}
          />

          <input
            type="text"
            value={oddsInput}
            placeholder={defaults.odds}
            onChange={(e) => setOddsInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit();
            }}
            className={`${compactInputClass} w-9 shrink-0 text-right tabular-nums text-emerald-500/90 placeholder:text-stone-600 sm:w-11`}
            aria-label="Odds"
          />

          <OutcomePill
            outcome={values.outcome}
            onClick={() =>
              setValues({
                ...values,
                outcome: cycleOutcome(values.outcome) as BetOutcome,
              })
            }
          />

          {repeatFrom && (
            <button
              type="button"
              onClick={applyRepeat}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-stone-600 hover:bg-white/5 hover:text-violet-400"
              title="Repeat last bet"
            >
              <Copy className="h-3 w-3" />
            </button>
          )}

          <button
            type="button"
            onClick={() => void submit()}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-600 text-white transition hover:bg-violet-500 active:scale-95"
            aria-label="Save bet"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1 px-2 pb-1.5">
          {MARKETS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMarket(m.id);
                if (m.id !== 'over' && m.id !== 'under') setTeamTotal(false);
              }}
              className={cn(
                'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide transition',
                market === m.id
                  ? m.id === 'parlay'
                    ? 'bg-yellow-500/20 text-yellow-300'
                    : 'bg-violet-500/25 text-violet-300'
                  : 'text-stone-600 hover:text-stone-400'
              )}
            >
              {m.label}
            </button>
          ))}
          {isTotal && (
            <>
              <span className="text-stone-700">|</span>
              <button
                type="button"
                onClick={() => setTeamTotal(false)}
                className={cn(
                  'rounded px-1.5 py-0.5 text-[9px] font-bold transition',
                  !teamTotal ? 'bg-stone-700/50 text-stone-300' : 'text-stone-600'
                )}
              >
                Game
              </button>
              <button
                type="button"
                onClick={() => setTeamTotal(true)}
                className={cn(
                  'rounded px-1.5 py-0.5 text-[9px] font-bold transition',
                  teamTotal ? 'bg-stone-700/50 text-stone-300' : 'text-stone-600'
                )}
              >
                TT
              </button>
            </>
          )}
          <span className="ml-auto truncate text-[9px] text-stone-600">{preview}</span>
        </div>
      </div>
    );
  }
);
