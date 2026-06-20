export type BetOutcome = 'win' | 'loss' | 'push' | 'pending';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  is_premium?: boolean;
  premium_grandfathered_at?: string | null;
  /** Resolved on /api/auth/me — DB flag or grandfather list. */
  premium?: boolean;
}

export interface Bet {
  id: string;
  user_id: string;
  bet_date: string;
  bet: string;
  wager: number;
  odds: string;
  outcome: BetOutcome;
  created_at: string;
  updated_at: string;
}

export interface BetInput {
  bet_date?: string;
  bet?: string;
  wager?: number;
  odds?: string;
  outcome?: BetOutcome;
}
