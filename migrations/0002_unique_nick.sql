-- Player names are unique, ignoring upper/lower case. Players without a name are not affected.
CREATE UNIQUE INDEX IF NOT EXISTS idx_nick ON scores (nick COLLATE NOCASE) WHERE nick <> '';
