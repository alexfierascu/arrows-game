-- Monthly season and Endless mode: two more leaderboards.
ALTER TABLE scores ADD COLUMN s_key TEXT NOT NULL DEFAULT '';        -- the month, YYYY-MM
ALTER TABLE scores ADD COLUMN s_score INTEGER NOT NULL DEFAULT 0;    -- points earned in that month
ALTER TABLE scores ADD COLUMN endless INTEGER NOT NULL DEFAULT 0;    -- best Endless run
-- Why the server finds this row suspicious ('' when it does not). Shown on the admin page.
ALTER TABLE scores ADD COLUMN flagged TEXT NOT NULL DEFAULT '';

-- A player reported another player's name. One row per reporter and reported player.
CREATE TABLE IF NOT EXISTS reports (
  player_id  TEXT NOT NULL,
  reporter   TEXT NOT NULL,              -- hash of the reporter's secret token
  at         INTEGER NOT NULL,
  PRIMARY KEY (player_id, reporter)
);

-- Names the filter refused, for the admin page. Only the newest are kept.
CREATE TABLE IF NOT EXISTS refused (
  at       INTEGER NOT NULL,
  player   TEXT NOT NULL,
  name     TEXT NOT NULL,
  country  TEXT NOT NULL DEFAULT ''
);

-- Daily reminders: one row per browser that asked for them.
CREATE TABLE IF NOT EXISTS push (
  endpoint  TEXT PRIMARY KEY,            -- where the browser's push service takes messages
  player    TEXT NOT NULL DEFAULT '',    -- player id, to skip those who already played today
  hour      INTEGER NOT NULL,            -- hour of the day (UTC) to send at
  tz        INTEGER NOT NULL DEFAULT 0   -- minutes ahead of UTC, to know the player's date
);
CREATE INDEX IF NOT EXISTS idx_push_hour ON push (hour);
CREATE INDEX IF NOT EXISTS idx_season ON scores (s_key, s_score DESC);
CREATE INDEX IF NOT EXISTS idx_endless ON scores (endless DESC);
