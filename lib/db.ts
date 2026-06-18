import { getBindings } from './env';
import type { Bet, BetInput, User } from './types';

export async function getDb(): Promise<D1Database> {
  const { DB } = await getBindings();
  return DB;
}

export async function upsertUser(user: User): Promise<void> {
  const db = await getDb();
  await db
    .prepare(
      `INSERT INTO users (id, email, name, avatar_url)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         email = excluded.email,
         name = excluded.name,
         avatar_url = excluded.avatar_url`
    )
    .bind(user.id, user.email, user.name, user.avatar_url)
    .run();
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await getDb();
  const row = await db
    .prepare('SELECT id, email, name, avatar_url FROM users WHERE id = ?')
    .bind(id)
    .first<User>();

  return row ?? null;
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
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const betDate = input.bet_date ?? now.slice(0, 10);

  await db
    .prepare(
      `INSERT INTO bet_log (id, user_id, bet_date, bet, wager, odds, outcome, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      userId,
      betDate,
      input.bet ?? '',
      input.wager ?? 0,
      input.odds ?? '-110',
      input.outcome ?? 'pending',
      now,
      now
    )
    .run();

  return {
    id,
    user_id: userId,
    bet_date: betDate,
    bet: input.bet ?? '',
    wager: input.wager ?? 0,
    odds: input.odds ?? '-110',
    outcome: input.outcome ?? 'pending',
    created_at: now,
    updated_at: now,
  };
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
