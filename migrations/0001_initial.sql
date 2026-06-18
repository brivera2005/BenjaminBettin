CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bet_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  bet_date TEXT NOT NULL,
  bet TEXT NOT NULL DEFAULT '',
  wager REAL NOT NULL DEFAULT 0,
  odds TEXT NOT NULL DEFAULT '-110',
  outcome TEXT NOT NULL DEFAULT 'pending' CHECK (outcome IN ('win', 'loss', 'push', 'pending')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS bet_log_user_created_idx
  ON bet_log (user_id, created_at DESC);
