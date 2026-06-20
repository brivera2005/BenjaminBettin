ALTER TABLE users ADD COLUMN is_premium INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN premium_grandfathered_at TEXT;

UPDATE users
SET
  is_premium = 1,
  premium_grandfathered_at = datetime('now')
WHERE lower(email) = 'brivera2005@gmail.com';
