-- Avatars: a number picked by the player (icon and colour), shown on the leaderboard.
ALTER TABLE scores ADD COLUMN avatar INTEGER NOT NULL DEFAULT 0;

-- Anonymous usage counts: how often each thing happened per day. No player ids, nothing personal.
CREATE TABLE IF NOT EXISTS events (
  day    TEXT NOT NULL,
  name   TEXT NOT NULL,
  count  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, name)
);
