ALTER TABLE users ADD COLUMN premium_purchased_at TEXT;
ALTER TABLE users ADD COLUMN stripe_checkout_session_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_checkout_session_idx
  ON users (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
