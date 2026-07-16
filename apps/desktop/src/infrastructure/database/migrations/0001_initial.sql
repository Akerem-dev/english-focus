-- SQLite vocabulary persistence baseline.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vocabulary_entries (
  normalized_word TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL,
  layer TEXT NOT NULL CHECK (layer IN ('user', 'override')),
  entry_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_entries_updated_at
  ON vocabulary_entries(updated_at DESC);
