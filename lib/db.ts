import { getBindings } from './env';
import { isGrandfatheredPremiumEmail } from './premium';
import type { Bet, BetInput, User } from './types';

export async function getDb(): Promise<D1Database> {
  const { DB } = await getBindings();
  return DB;
}

export async function upsertUser(user: User): Promise<void> {
  const db = await getDb();
  const grandfather = isGrandfatheredPremiumEmail(user.email);
  await db
    .prepare(
      `INSERT INTO users (id, email, name, avatar_url, is_premium, premium_grandfathered_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         email = excluded.email,
         name = excluded.name,
         avatar_url = excluded.avatar_url,
         is_premium = CASE
           WHEN excluded.is_premium = 1 THEN 1
           WHEN users.is_premium = 1 THEN 1
           ELSE users.is_premium
         END,
         premium_grandfathered_at = COALESCE(users.premium_grandfathered_at, excluded.premium_grandfathered_at)`
    )
    .bind(
      user.id,
      user.email,
      user.name,
      user.avatar_url,
      grandfather ? 1 : 0,
      grandfather ? new Date().toISOString() : null
    )
    .run();
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT id, email, name, avatar_url, is_premium, premium_grandfathered_at, premium_purchased_at
       FROM users WHERE id = ?`
    )
    .bind(id)
    .first<{
      id: string;
      email: string;
      name: string | null;
      avatar_url: string | null;
      is_premium: number;
      premium_grandfathered_at: string | null;
      premium_purchased_at: string | null;
    }>();

  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar_url: row.avatar_url,
    is_premium: Boolean(row.is_premium),
    premium_grandfathered_at: row.premium_grandfathered_at,
    premium_purchased_at: row.premium_purchased_at,
  };
}

export async function isStripeCheckoutSessionProcessed(sessionId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db
    .prepare('SELECT id FROM users WHERE stripe_checkout_session_id = ? LIMIT 1')
    .bind(sessionId)
    .first<{ id: string }>();
  return Boolean(row);
}

export async function grantPremiumFromStripe(
  userId: string,
  stripeSessionId: string
): Promise<boolean> {
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE users
       SET is_premium = 1,
           premium_purchased_at = COALESCE(premium_purchased_at, ?),
           stripe_checkout_session_id = ?
       WHERE id = ?`
    )
    .bind(now, stripeSessionId, userId)
    .run();

  return (result.meta.changes ?? 0) > 0;
}

export async function listBetsForUser(userId: string): Promise<Bet[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT id, user_id, bet_date, bet, wager, odds, outcome, created_at, updated_at
       FROM bet_log
       WHERE user_id = ?
       ORDER BY created_at DESC`
    )
    .bind(userId)
    .all<Bet>();

  return results ?? [];
}

export async function createBet(userId: string, input: BetInput = {}): Promise<Bet> {
  const [bet] = await createBetsBulk(userId, [input]);
  return bet;
}

export async function createBetsBulk(userId: string, inputs: BetInput[]): Promise<Bet[]> {
  if (inputs.length === 0) return [];

  const db = await getDb();
  const now = new Date().toISOString();
  const bets: Bet[] = inputs.map((input) => {
    const betDate = input.bet_date ?? now.slice(0, 10);
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      bet_date: betDate,
      bet: input.bet ?? '',
      wager: input.wager ?? 0,
      odds: input.odds ?? '-110',
      outcome: input.outcome ?? 'pending',
      created_at: now,
      updated_at: now,
    };
  });

  const statements = bets.map((bet) =>
    db
      .prepare(
        `INSERT INTO bet_log (id, user_id, bet_date, bet, wager, odds, outcome, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        bet.id,
        bet.user_id,
        bet.bet_date,
        bet.bet,
        bet.wager,
        bet.odds,
        bet.outcome,
        bet.created_at,
        bet.updated_at
      )
  );

  await db.batch(statements);
  return bets;
}

export async function updateBet(
  userId: string,
  betId: string,
  input: BetInput
): Promise<Bet | null> {
  const db = await getDb();
  const existing = await db
    .prepare('SELECT * FROM bet_log WHERE id = ? AND user_id = ?')
    .bind(betId, userId)
    .first<Bet>();

  if (!existing) return null;

  const updated: Bet = {
    ...existing,
    bet_date: input.bet_date ?? existing.bet_date,
    bet: input.bet ?? existing.bet,
    wager: input.wager ?? existing.wager,
    odds: input.odds ?? existing.odds,
    outcome: input.outcome ?? existing.outcome,
    updated_at: new Date().toISOString(),
  };

  await db
    .prepare(
      `UPDATE bet_log
       SET bet_date = ?, bet = ?, wager = ?, odds = ?, outcome = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`
    )
    .bind(
      updated.bet_date,
      updated.bet,
      updated.wager,
      updated.odds,
      updated.outcome,
      updated.updated_at,
      betId,
      userId
    )
    .run();

  return updated;
}

export async function deleteBet(userId: string, betId: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .prepare('DELETE FROM bet_log WHERE id = ? AND user_id = ?')
    .bind(betId, userId)
    .run();

  return (result.meta.changes ?? 0) > 0;
}

export async function getUserOddsApiKey(userId: string): Promise<string | null> {
  const db = await getDb();
  const row = await db
    .prepare('SELECT odds_api_key FROM users WHERE id = ? LIMIT 1')
    .bind(userId)
    .first<{ odds_api_key: string | null }>();

  const key = row?.odds_api_key?.trim();
  return key || null;
}

export async function setUserOddsApiKey(userId: string, apiKey: string | null): Promise<void> {
  const db = await getDb();
  await db
    .prepare('UPDATE users SET odds_api_key = ? WHERE id = ?')
    .bind(apiKey?.trim() || null, userId)
    .run();
}
