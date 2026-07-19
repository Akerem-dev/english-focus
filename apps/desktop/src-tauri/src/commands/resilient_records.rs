use rusqlite::{params, Connection};
use serde::Serialize;
use serde_json::Value;
use tauri::State;

use crate::{state::AppState, validation::validate_vocabulary_entry};

const MAX_ACTIVITY_RECORDS: i64 = 250;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredVocabularyEntry {
    entry: Value,
    layer: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityRecord {
    id: String,
    kind: String,
    scope: String,
    label: String,
    target: Option<String>,
    occurred_at: String,
}

fn is_supported_vocabulary_layer(layer: &str) -> bool {
    matches!(layer, "user" | "override")
}

fn read_vocabulary_entries(connection: &Connection) -> Result<Vec<StoredVocabularyEntry>, String> {
    let mut statement = connection
        .prepare(
            "SELECT entry_json, layer FROM vocabulary_entries ORDER BY updated_at DESC, normalized_word ASC",
        )
        .map_err(|error| format!("Stored vocabulary could not be prepared: {error}"))?;
    let rows = statement
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|error| format!("Stored vocabulary could not be queried: {error}"))?;

    let mut records = Vec::new();
    for row in rows {
        let Ok((entry_json, layer)) = row else {
            continue;
        };
        if !is_supported_vocabulary_layer(&layer) {
            continue;
        }
        let Ok(entry) = serde_json::from_str::<Value>(&entry_json) else {
            continue;
        };
        if validate_vocabulary_entry(&entry).is_err() {
            continue;
        }

        records.push(StoredVocabularyEntry { entry, layer });
    }

    Ok(records)
}

fn is_allowed_activity_kind(value: &str) -> bool {
    matches!(
        value,
        "vocabulary-viewed"
            | "favorite-changed"
            | "study-details-saved"
            | "vocabulary-saved"
            | "entry-kept"
            | "export-created"
            | "clipboard-copied"
            | "settings-updated"
            | "backup-created"
            | "backup-restored"
            | "backup-deleted"
            | "diagnostics-run"
            | "local-data-reset"
            | "operation-warning"
            | "operation-failed"
    )
}

fn is_allowed_activity_scope(value: &str) -> bool {
    matches!(
        value,
        "vocabulary" | "library" | "settings" | "backup" | "system"
    )
}

fn is_valid_activity_record(record: &ActivityRecord) -> bool {
    !record.id.trim().is_empty()
        && record.id.chars().count() <= 160
        && is_allowed_activity_kind(&record.kind)
        && is_allowed_activity_scope(&record.scope)
        && !record.label.trim().is_empty()
        && record.label.chars().count() <= 160
        && record
            .target
            .as_ref()
            .is_none_or(|target| !target.trim().is_empty() && target.chars().count() <= 160)
        && !record.occurred_at.trim().is_empty()
        && record.occurred_at.chars().count() <= 64
}

fn read_activity(connection: &Connection, limit: i64) -> Result<Vec<ActivityRecord>, String> {
    let mut statement = connection
        .prepare(
            r#"
            SELECT id, kind, scope, label, target, occurred_at
            FROM activity_log
            ORDER BY occurred_at DESC, rowid DESC
            LIMIT ?1
            "#,
        )
        .map_err(|error| format!("Recent activity could not be prepared: {error}"))?;
    let rows = statement
        .query_map(params![limit], |row| {
            Ok(ActivityRecord {
                id: row.get(0)?,
                kind: row.get(1)?,
                scope: row.get(2)?,
                label: row.get(3)?,
                target: row.get(4)?,
                occurred_at: row.get(5)?,
            })
        })
        .map_err(|error| format!("Recent activity could not be queried: {error}"))?;

    let mut records = Vec::new();
    for row in rows {
        let Ok(record) = row else {
            continue;
        };
        if is_valid_activity_record(&record) {
            records.push(record);
        }
    }

    Ok(records)
}

#[tauri::command]
pub fn list_resilient_vocabulary_entries(
    state: State<'_, AppState>,
) -> Result<Vec<StoredVocabularyEntry>, String> {
    let connection = state
        .database
        .lock()
        .map_err(|_| "The local vocabulary database lock is unavailable.".to_string())?;
    read_vocabulary_entries(&connection)
}

#[tauri::command]
pub fn list_resilient_activity(
    limit: Option<i64>,
    state: State<'_, AppState>,
) -> Result<Vec<ActivityRecord>, String> {
    let limit = limit.unwrap_or(100).clamp(1, MAX_ACTIVITY_RECORDS);
    let connection = state
        .database
        .lock()
        .map_err(|_| "The local activity database lock is unavailable.".to_string())?;
    read_activity(&connection, limit)
}

#[cfg(test)]
mod tests {
    use rusqlite::{params, Connection};

    use super::{read_activity, read_vocabulary_entries};

    #[test]
    fn malformed_vocabulary_rows_do_not_hide_valid_entries() {
        let connection = Connection::open_in_memory().expect("database should open");
        connection
            .execute_batch(
                r#"
                CREATE TABLE vocabulary_entries(
                    normalized_word TEXT,
                    entry_json TEXT,
                    layer TEXT,
                    updated_at TEXT
                );
                "#,
            )
            .expect("table should be created");

        let valid_entry = include_str!("../../../src/content/core/entries/maintain.entry.json");
        connection
            .execute(
                "INSERT INTO vocabulary_entries VALUES (?1, ?2, 'override', ?3)",
                params!["maintain", valid_entry, "2026-07-19T12:00:00.000Z"],
            )
            .expect("valid row should be inserted");
        connection
            .execute(
                "INSERT INTO vocabulary_entries VALUES ('broken', '{', 'user', '2026-07-19T11:00:00.000Z')",
                [],
            )
            .expect("broken row should be inserted");
        connection
            .execute(
                "INSERT INTO vocabulary_entries VALUES ('wrong-layer', ?1, 'core', '2026-07-19T10:00:00.000Z')",
                params![valid_entry],
            )
            .expect("unsupported layer row should be inserted");

        let records = read_vocabulary_entries(&connection).expect("valid rows should still load");

        assert_eq!(records.len(), 1);
        assert_eq!(records[0].layer, "override");
        assert_eq!(records[0].entry["normalizedWord"], "maintain");
    }

    #[test]
    fn malformed_activity_rows_do_not_hide_valid_activity() {
        let connection = Connection::open_in_memory().expect("database should open");
        connection
            .execute_batch(
                r#"
                CREATE TABLE activity_log(
                    id TEXT,
                    kind TEXT,
                    scope TEXT,
                    label TEXT,
                    target TEXT,
                    occurred_at TEXT
                );
                INSERT INTO activity_log VALUES(
                    'good', 'vocabulary-viewed', 'vocabulary', 'Viewed maintain', 'maintain',
                    '2026-07-19T12:00:00.000Z'
                );
                INSERT INTO activity_log VALUES(
                    'bad-kind', 'unknown-event', 'system', 'Unknown event', NULL,
                    '2026-07-19T11:00:00.000Z'
                );
                INSERT INTO activity_log VALUES(
                    'bad-label', 'diagnostics-run', 'system', 42, NULL,
                    '2026-07-19T10:00:00.000Z'
                );
                "#,
            )
            .expect("activity fixtures should be inserted");

        let records = read_activity(&connection, 100).expect("valid activity should still load");

        assert_eq!(records.len(), 1);
        assert_eq!(records[0].id, "good");
    }
}
