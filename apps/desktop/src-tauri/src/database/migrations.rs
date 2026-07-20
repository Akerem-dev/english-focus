use std::{collections::HashSet, error::Error, fmt};

use rusqlite::{Connection, OptionalExtension};

pub const CURRENT_DATABASE_SCHEMA_VERSION: u32 = 3;

const METADATA_SCHEMA: &str = r#"
CREATE TABLE IF NOT EXISTS schema_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"#;

const MIGRATION_1: &str = r#"
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
"#;

const MIGRATION_2: &str = r#"
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
"#;

const MIGRATION_3: &str = r#"
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
"#;

#[derive(Debug)]
pub enum MigrationError {
    Database(rusqlite::Error),
    InvalidStoredVersion(String),
    UnsupportedFutureVersion { found: u32, supported: u32 },
    IncompleteSchema { version: u32, detail: String },
}

impl fmt::Display for MigrationError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Database(error) => write!(formatter, "{error}"),
            Self::InvalidStoredVersion(value) => {
                write!(formatter, "Stored database schema version '{value}' is invalid.")
            }
            Self::UnsupportedFutureVersion { found, supported } => write!(
                formatter,
                "Database schema version {found} is newer than the supported version {supported}."
            ),
            Self::IncompleteSchema { version, detail } => write!(
                formatter,
                "Database schema version {version} is incomplete: {detail}"
            ),
        }
    }
}

impl Error for MigrationError {}

impl From<rusqlite::Error> for MigrationError {
    fn from(error: rusqlite::Error) -> Self {
        Self::Database(error)
    }
}

#[derive(Clone, Copy)]
struct Migration {
    version: u32,
    sql: &'static str,
}

const MIGRATIONS: [Migration; 3] = [
    Migration {
        version: 1,
        sql: MIGRATION_1,
    },
    Migration {
        version: 2,
        sql: MIGRATION_2,
    },
    Migration {
        version: 3,
        sql: MIGRATION_3,
    },
];

fn object_exists(
    connection: &Connection,
    object_type: &str,
    name: &str,
) -> Result<bool, MigrationError> {
    connection
        .query_row(
            "SELECT 1 FROM sqlite_master WHERE type = ?1 AND name = ?2",
            [object_type, name],
            |_| Ok(true),
        )
        .optional()
        .map(|value| value.unwrap_or(false))
        .map_err(MigrationError::from)
}

fn table_columns(connection: &Connection, table: &str) -> Result<HashSet<String>, MigrationError> {
    let mut statement = connection.prepare(&format!("PRAGMA table_info({table})"))?;
    let rows = statement.query_map([], |row| row.get::<_, String>(1))?;
    rows.collect::<Result<HashSet<_>, _>>()
        .map_err(MigrationError::from)
}

fn require_table(
    connection: &Connection,
    version: u32,
    table: &str,
    required_columns: &[&str],
) -> Result<(), MigrationError> {
    if !object_exists(connection, "table", table)? {
        return Err(MigrationError::IncompleteSchema {
            version,
            detail: format!("required table '{table}' is missing"),
        });
    }

    let columns = table_columns(connection, table)?;
    let missing: Vec<&str> = required_columns
        .iter()
        .copied()
        .filter(|column| !columns.contains(*column))
        .collect();
    if !missing.is_empty() {
        return Err(MigrationError::IncompleteSchema {
            version,
            detail: format!(
                "table '{table}' is missing column(s): {}",
                missing.join(", ")
            ),
        });
    }

    Ok(())
}

fn require_index(
    connection: &Connection,
    version: u32,
    index: &str,
) -> Result<(), MigrationError> {
    if object_exists(connection, "index", index)? {
        Ok(())
    } else {
        Err(MigrationError::IncompleteSchema {
            version,
            detail: format!("required index '{index}' is missing"),
        })
    }
}

fn verify_schema(connection: &Connection, version: u32) -> Result<(), MigrationError> {
    require_table(connection, version, "schema_metadata", &["key", "value"])?;

    if version >= 1 {
        require_table(
            connection,
            version,
            "vocabulary_entries",
            &[
                "normalized_word",
                "entry_id",
                "layer",
                "entry_json",
                "created_at",
                "updated_at",
            ],
        )?;
        require_index(connection, version, "idx_vocabulary_entries_updated_at")?;
    }

    if version >= 2 {
        require_table(
            connection,
            version,
            "activity_log",
            &["id", "kind", "scope", "label", "target", "occurred_at"],
        )?;
        require_index(connection, version, "idx_activity_log_occurred_at")?;
        require_table(
            connection,
            version,
            "app_settings",
            &["id", "settings_json", "updated_at"],
        )?;
    }

    if version >= 3 {
        require_table(
            connection,
            version,
            "vocabulary_user_metadata",
            &[
                "normalized_word",
                "favorite",
                "tags_json",
                "note",
                "learning_status",
                "review_status",
                "last_viewed_at",
                "view_count",
                "created_at",
                "updated_at",
            ],
        )?;
    }

    Ok(())
}

fn stored_version(connection: &Connection) -> Result<Option<u32>, MigrationError> {
    let value = connection
        .query_row(
            "SELECT value FROM schema_metadata WHERE key = 'database_schema_version'",
            [],
            |row| row.get::<_, String>(0),
        )
        .optional()?;

    value
        .map(|value| {
            value
                .parse::<u32>()
                .map_err(|_| MigrationError::InvalidStoredVersion(value))
        })
        .transpose()
}

fn schema_shape_is_complete(connection: &Connection, version: u32) -> bool {
    verify_schema(connection, version).is_ok()
}

fn infer_legacy_version(connection: &Connection) -> u32 {
    (1..=CURRENT_DATABASE_SCHEMA_VERSION)
        .rev()
        .find(|version| schema_shape_is_complete(connection, *version))
        .unwrap_or(0)
}

fn write_version(connection: &Connection, version: u32) -> Result<(), MigrationError> {
    connection.execute(
        r#"
        INSERT INTO schema_metadata(key, value)
        VALUES ('database_schema_version', ?1)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
        "#,
        [version.to_string()],
    )?;
    Ok(())
}

fn apply_migration(connection: &Connection, migration: Migration) -> Result<(), MigrationError> {
    let transaction = connection.unchecked_transaction()?;
    transaction.execute_batch(migration.sql)?;
    verify_schema(&transaction, migration.version)?;
    write_version(&transaction, migration.version)?;
    transaction.commit()?;
    Ok(())
}

fn reapply_current_schema(connection: &Connection) -> Result<(), MigrationError> {
    let transaction = connection.unchecked_transaction()?;
    for migration in MIGRATIONS {
        transaction.execute_batch(migration.sql)?;
    }
    verify_schema(&transaction, CURRENT_DATABASE_SCHEMA_VERSION)?;
    write_version(&transaction, CURRENT_DATABASE_SCHEMA_VERSION)?;
    transaction.commit()?;
    Ok(())
}

pub fn run(connection: &Connection) -> Result<(), MigrationError> {
    connection.execute_batch(METADATA_SCHEMA)?;

    let current_version =
        stored_version(connection)?.unwrap_or_else(|| infer_legacy_version(connection));
    if current_version > CURRENT_DATABASE_SCHEMA_VERSION {
        return Err(MigrationError::UnsupportedFutureVersion {
            found: current_version,
            supported: CURRENT_DATABASE_SCHEMA_VERSION,
        });
    }

    for migration in MIGRATIONS
        .iter()
        .copied()
        .filter(|migration| migration.version > current_version)
    {
        apply_migration(connection, migration)?;
    }

    reapply_current_schema(connection)
}

#[cfg(test)]
mod tests {
    use rusqlite::{Connection, OptionalExtension};

    use super::{run, CURRENT_DATABASE_SCHEMA_VERSION};

    fn version(connection: &Connection) -> Option<u32> {
        connection
            .query_row(
                "SELECT value FROM schema_metadata WHERE key = 'database_schema_version'",
                [],
                |row| row.get::<_, String>(0),
            )
            .optional()
            .expect("schema version query should succeed")
            .map(|value| {
                value
                    .parse()
                    .expect("stored schema version should be numeric")
            })
    }

    fn table_exists(connection: &Connection, table: &str) -> bool {
        connection
            .query_row(
                "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?1",
                [table],
                |_| Ok(true),
            )
            .optional()
            .expect("table lookup should succeed")
            .unwrap_or(false)
    }

    #[test]
    fn creates_a_fresh_database_at_the_current_version() {
        let connection = Connection::open_in_memory().expect("database should open");

        run(&connection).expect("fresh database should migrate");

        assert_eq!(version(&connection), Some(CURRENT_DATABASE_SCHEMA_VERSION));
        for table in [
            "schema_metadata",
            "vocabulary_entries",
            "activity_log",
            "app_settings",
            "vocabulary_user_metadata",
        ] {
            assert!(table_exists(&connection, table), "missing table: {table}");
        }
    }

    #[test]
    fn upgrades_version_one_without_replacing_existing_vocabulary() {
        let connection = Connection::open_in_memory().expect("database should open");
        connection
            .execute_batch(
                r#"
                CREATE TABLE schema_metadata(key TEXT PRIMARY KEY, value TEXT NOT NULL);
                INSERT INTO schema_metadata VALUES('database_schema_version', '1');
                CREATE TABLE vocabulary_entries(
                    normalized_word TEXT PRIMARY KEY,
                    entry_id TEXT NOT NULL,
                    layer TEXT NOT NULL,
                    entry_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE INDEX idx_vocabulary_entries_updated_at
                    ON vocabulary_entries(updated_at DESC);
                INSERT INTO vocabulary_entries VALUES(
                    'maintain', 'word:maintain', 'override', '{}',
                    '2026-07-19T00:00:00.000Z', '2026-07-19T00:00:00.000Z'
                );
                "#,
            )
            .expect("version one fixture should be created");

        run(&connection).expect("version one should upgrade");

        let retained: i64 = connection
            .query_row("SELECT COUNT(*) FROM vocabulary_entries", [], |row| {
                row.get(0)
            })
            .expect("vocabulary count should be readable");
        assert_eq!(retained, 1);
        assert_eq!(version(&connection), Some(CURRENT_DATABASE_SCHEMA_VERSION));
        assert!(table_exists(&connection, "vocabulary_user_metadata"));
    }

    #[test]
    fn infers_an_unversioned_version_two_database_before_upgrading() {
        let connection = Connection::open_in_memory().expect("database should open");
        connection
            .execute_batch(
                r#"
                CREATE TABLE schema_metadata(key TEXT PRIMARY KEY, value TEXT NOT NULL);
                CREATE TABLE vocabulary_entries(
                    normalized_word TEXT PRIMARY KEY,
                    entry_id TEXT NOT NULL,
                    layer TEXT NOT NULL,
                    entry_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE INDEX idx_vocabulary_entries_updated_at
                    ON vocabulary_entries(updated_at DESC);
                CREATE TABLE activity_log(
                    id TEXT PRIMARY KEY,
                    kind TEXT NOT NULL,
                    scope TEXT NOT NULL,
                    label TEXT NOT NULL,
                    target TEXT,
                    occurred_at TEXT NOT NULL
                );
                CREATE INDEX idx_activity_log_occurred_at ON activity_log(occurred_at DESC);
                CREATE TABLE app_settings(
                    id INTEGER PRIMARY KEY,
                    settings_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                "#,
            )
            .expect("unversioned fixture should be created");

        run(&connection).expect("unversioned database should upgrade");

        assert_eq!(version(&connection), Some(CURRENT_DATABASE_SCHEMA_VERSION));
        assert!(table_exists(&connection, "vocabulary_user_metadata"));
    }

    #[test]
    fn refuses_to_open_a_database_from_a_future_build() {
        let connection = Connection::open_in_memory().expect("database should open");
        connection
            .execute_batch(
                r#"
                CREATE TABLE schema_metadata(key TEXT PRIMARY KEY, value TEXT NOT NULL);
                INSERT INTO schema_metadata VALUES('database_schema_version', '99');
                "#,
            )
            .expect("future-version fixture should be created");

        let error = run(&connection).expect_err("future schema must be rejected");

        assert!(error.to_string().contains("newer than the supported version"));
        assert_eq!(version(&connection), Some(99));
    }

    #[test]
    fn does_not_advance_the_version_when_an_existing_table_is_incompatible() {
        let connection = Connection::open_in_memory().expect("database should open");
        connection
            .execute_batch(
                r#"
                CREATE TABLE schema_metadata(key TEXT PRIMARY KEY, value TEXT NOT NULL);
                INSERT INTO schema_metadata VALUES('database_schema_version', '1');
                CREATE TABLE vocabulary_entries(
                    normalized_word TEXT PRIMARY KEY,
                    entry_id TEXT NOT NULL,
                    layer TEXT NOT NULL,
                    entry_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE INDEX idx_vocabulary_entries_updated_at
                    ON vocabulary_entries(updated_at DESC);
                CREATE TABLE activity_log(id TEXT PRIMARY KEY);
                "#,
            )
            .expect("incompatible fixture should be created");

        let error = run(&connection).expect_err("incompatible schema must fail");

        assert!(error.to_string().contains("activity_log"));
        assert_eq!(version(&connection), Some(1));
    }
}
