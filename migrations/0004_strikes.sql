-- Offensive-name attempts. `who` is the hash of the player's secret token, never a name or an
-- address. Rows are deleted once they are no longer needed (see rejectName in src/worker.js).
CREATE TABLE IF NOT EXISTS strikes (
  who            TEXT PRIMARY KEY,
  count          INTEGER NOT NULL DEFAULT 0,  -- attempts since first_at
  first_at       INTEGER NOT NULL DEFAULT 0,  -- when the current run of attempts started (ms)
  blocked_until  INTEGER NOT NULL DEFAULT 0   -- the player is locked out until then (ms)
);
