-- Public profile: the player's badges as bits, in the order of BADGES in public/js/badges.js.
ALTER TABLE scores ADD COLUMN badges INTEGER NOT NULL DEFAULT 0;
-- The club the player belongs to ('' for none). Only the club routes change it.
ALTER TABLE scores ADD COLUMN club TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_club ON scores (club);

-- Clubs: small groups ranked by their members' season points. `id` is also the join code.
CREATE TABLE IF NOT EXISTS clubs (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  owner       TEXT NOT NULL,             -- player id of the founder
  created_at  INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_club_name ON clubs (name COLLATE NOCASE);

-- A player's points in a finished season, kept when their row moves on to a new month, so the
-- final ranking can still be worked out for the prizes.
CREATE TABLE IF NOT EXISTS season_results (
  s_key  TEXT NOT NULL,
  id     TEXT NOT NULL,
  score  INTEGER NOT NULL,
  PRIMARY KEY (s_key, id)
);

-- Live races: two players on the same board. Rows are deleted an hour after they were made.
CREATE TABLE IF NOT EXISTS races (
  code         TEXT PRIMARY KEY,
  seed         INTEGER NOT NULL,
  created_at   INTEGER NOT NULL,
  start_at     INTEGER NOT NULL DEFAULT 0,   -- 0 until the second player joins
  host         TEXT NOT NULL,                -- hash of the host's race key
  host_name    TEXT NOT NULL DEFAULT '',
  host_av      INTEGER NOT NULL DEFAULT 0,
  host_left    INTEGER NOT NULL DEFAULT -1,  -- arrows still on the host's board (-1: not known yet)
  host_state   TEXT NOT NULL DEFAULT 'play', -- play | won | lost | left
  guest        TEXT NOT NULL DEFAULT '',
  guest_name   TEXT NOT NULL DEFAULT '',
  guest_av     INTEGER NOT NULL DEFAULT 0,
  guest_left   INTEGER NOT NULL DEFAULT -1,
  guest_state  TEXT NOT NULL DEFAULT 'play'
);

-- Messages players send from Settings, for the admin page.
CREATE TABLE IF NOT EXISTS feedback (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  at       INTEGER NOT NULL,
  player   TEXT NOT NULL DEFAULT '',
  text     TEXT NOT NULL,
  lang     TEXT NOT NULL DEFAULT '',
  country  TEXT NOT NULL DEFAULT ''
);

-- Players who passed the bot check (only used when TURNSTILE_SECRET is set).
CREATE TABLE IF NOT EXISTS verified (
  who    TEXT PRIMARY KEY,               -- hash of the player's secret token
  until  INTEGER NOT NULL
);
