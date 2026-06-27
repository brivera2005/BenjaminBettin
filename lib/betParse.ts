export type BetMarket = 'ml' | 'spread' | 'over' | 'under' | 'parlay';

export interface ParsedBetDescription {
  market: BetMarket;
  line?: number;
  /** Team name to find the game (and team total side when applicable). */
  teamHint: string;
  /** True only when bet explicitly says TT / team total. */
  teamTotal: boolean;
  /** Set when auto-grade cannot handle this bet type. */
  unsupported?: string;
}

export function isParlayLike(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/\bparlay\b/i.test(t)) return true;

  const spreadLegs = (t.match(/[+-]\d+(?:\.\d+)?/g) ?? []).length;
  const mlCount = (t.toLowerCase().match(/\bml\b/g) ?? []).length;
  if (spreadLegs >= 2 || mlCount >= 2) return true;

  const parts = t.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return true;

  return false;
}

function detectUnsupported(text: string): string | null {
  const t = text.toLowerCase();
  if (isParlayLike(text)) return 'Parlay — grade manually when all legs settle';
  if (/\bf5\b|first\s*5|1st\s*5|first\s*five/i.test(t)) return 'F5 — scores API is full game only';
  if (/\bbtts\b|both teams to score/i.test(t)) return 'BTTS — not supported yet';
  if (/\d+\.?\d*\s*k\b|\bstrikeouts?\b|\bpassing yds?\b|\brbis?\b|\bhits?\b|\bhr\b|\bhome runs?\b|\bpoints?\b|\brebounds?\b|\bassists?\b|\b3pt/i.test(t)) {
    return 'Player props — not supported yet';
  }
  return null;
}

export function manualGradeReason(betText: string): string | null {
  return detectUnsupported(betText);
}

export function needsManualGrading(
  bet: { outcome: string },
  autoGradeMissed = false
): { manual: boolean; reason: string | null } {
  if (bet.outcome !== 'pending' || !autoGradeMissed) {
    return { manual: false, reason: null };
  }
  return { manual: true, reason: 'Auto-grade missed — tap pill to set W/L' };
}

export function parseBetDescription(text: string): ParsedBetDescription {
  let working = text.trim();
  const unsupported = detectUnsupported(working);

  if (isParlayLike(working)) {
    return {
      market: 'parlay',
      teamHint: working,
      teamTotal: false,
      unsupported: unsupported ?? undefined,
    };
  }

  let teamTotal = /\b(?:tt|team total|team t)\b/i.test(working);
  if (teamTotal) {
    working = working.replace(/\b(?:tt|team total|team t)\b/gi, ' ');
  }

  let market: BetMarket = 'ml';
  let line: number | undefined;

  const underMatch =
    working.match(/\b(?:under|u)\s*(\d+(?:\.\d+)?)\b/i) ??
    working.match(/\bu(\d+(?:\.\d+)?)\b/i);
  const overMatch =
    working.match(/\b(?:over|o)\s*(\d+(?:\.\d+)?)\b/i) ??
    working.match(/\bo(\d+(?:\.\d+)?)\b/i);

  if (underMatch) {
    market = 'under';
    line = Number.parseFloat(underMatch[1]);
    working = working.replace(underMatch[0], ' ');
  } else if (overMatch) {
    market = 'over';
    line = Number.parseFloat(overMatch[1]);
    working = working.replace(overMatch[0], ' ');
  } else {
    const spreadMatch = working.match(/([+-]\d+(?:\.\d+)?)/);
    if (spreadMatch) {
      const parsed = Number.parseFloat(spreadMatch[1]);
      if (Math.abs(parsed) <= 45) {
        market = 'spread';
        line = parsed;
        working = working.replace(spreadMatch[0], ' ');
      }
    }
  }

  if (/\b(?:ml|moneyline|money line)\b/i.test(working)) {
    market = 'ml';
    working = working.replace(/\b(?:ml|moneyline|money line)\b/gi, ' ');
  }

  const teamHint = working.replace(/\s+/g, ' ').trim();

  return {
    market,
    line,
    teamHint: teamHint || text.trim(),
    teamTotal,
    unsupported: unsupported ?? undefined,
  };
}

export function formatBetDescription(
  team: string,
  market: BetMarket,
  line?: number,
  teamTotal = false
): string {
  const t = team.trim();
  if (!t) return '';

  switch (market) {
    case 'parlay':
      return t;
    case 'spread':
      return line !== undefined ? `${t} ${line > 0 ? `+${line}` : line}` : t;
    case 'over':
      if (line !== undefined) {
        return teamTotal ? `${t} TT O${line}` : `${t} O${line}`;
      }
      return teamTotal ? `${t} TT O` : `${t} O`;
    case 'under':
      if (line !== undefined) {
        return teamTotal ? `${t} TT U${line}` : `${t} U${line}`;
      }
      return teamTotal ? `${t} TT U` : `${t} U`;
    default:
      return /\bml\b/i.test(t) ? t : `${t} ML`;
  }
}
