use rusqlite::{Connection, Result};

const INITIAL_SCHEMA: &str = r#"
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


CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    scope TEXT NOT NULL,
    label TEXT NOT NULL,
    target TEXT,
    occurred_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_log_occurred_at
    ON activity_log(occurred_at DESC);

CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    settings_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

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

INSERT INTO schema_metadata(key, value)
VALUES ('database_schema_version', '3')
ON CONFLICT(key) DO UPDATE SET value = excluded.value;
"#;

pub fn run(connection: &Connection) -> Result<()> {
    connection.execute_batch(INITIAL_SCHEMA)
}
