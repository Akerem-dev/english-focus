CREATE TABLE IF NOT EXISTS vocabulary_user_metadata (
  normalized_word TEXT PRIMARY KEY,
  favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1)),
  tags_json TEXT NOT NULL DEFAULT '[]',
  note TEXT NOT NULL DEFAULT '',
  learning_status TEXT NOT NULL DEFAULT 'new',
  review_status TEXT NOT NULL DEFAULT 'reviewed',
  last_viewed_at TEXT,
  view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
