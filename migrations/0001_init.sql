-- Leaderboard: one row per player (a random id stored in their browser).
CREATE TABLE IF NOT EXISTS scores (
  id          TEXT PRIMARY KEY,
  token_hash  TEXT NOT NULL,
  nick        TEXT NOT NULL DEFAULT '',
  total       INTEGER NOT NULL DEFAULT 0,
  stars       INTEGER NOT NULL DEFAULT 0,
  cleared     INTEGER NOT NULL DEFAULT 0,
  bosses      INTEGER NOT NULL DEFAULT 0,
  d_date      TEXT NOT NULL DEFAULT '',
  d_score     INTEGER NOT NULL DEFAULT 0,
  d_time      INTEGER NOT NULL DEFAULT 0,
  e_key       TEXT NOT NULL DEFAULT '',
  e_score     INTEGER NOT NULL DEFAULT 0,
  updated_at  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_total ON scores (total DESC);
CREATE INDEX IF NOT EXISTS idx_stars ON scores (stars DESC);
CREATE INDEX IF NOT EXISTS idx_daily ON scores (d_date, d_score DESC);
CREATE INDEX IF NOT EXISTS idx_event ON scores (e_key, e_score DESC);
