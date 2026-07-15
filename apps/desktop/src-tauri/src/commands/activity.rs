use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::state::AppState;

const MAX_ACTIVITY_RECORDS: i64 = 250;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityRecord {
    id: String,
    kind: String,
    scope: String,
    label: String,
    target: Option<String>,
    occurred_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordActivityRequest {
    id: String,
    kind: String,
    scope: String,
    label: String,
    target: Option<String>,
    occurred_at: String,
}

fn is_allowed_kind(value: &str) -> bool {
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
            | "operation-warning"
            | "operation-failed"
    )
}

fn is_allowed_scope(value: &str) -> bool {
    matches!(value, "vocabulary" | "library" | "settings" | "backup" | "system")
}

fn validate_request(request: &RecordActivityRequest) -> Result<(), String> {
    if request.id.trim().is_empty() || request.id.chars().count() > 160 {
        return Err("Activity id must contain between 1 and 160 characters.".to_string());
    }
    if !is_allowed_kind(&request.kind) {
        return Err("Activity kind is not supported by this application build.".to_string());
    }
    if !is_allowed_scope(&request.scope) {
        return Err("Activity scope is not supported by this application build.".to_string());
    }
    if request.label.trim().is_empty() || request.label.chars().count() > 160 {
        return Err("Activity label must contain between 1 and 160 characters.".to_string());
    }
    if request
        .target
        .as_ref()
        .is_some_and(|target| target.trim().is_empty() || target.chars().count() > 160)
    {
        return Err("Activity target must contain between 1 and 160 characters.".to_string());
    }
    if request.occurred_at.trim().is_empty() || request.occurred_at.chars().count() > 64 {
        return Err("Activity timestamp is required.".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn list_activity(
    limit: Option<i64>,
    state: State<'_, AppState>,
) -> Result<Vec<ActivityRecord>, String> {
    let limit = limit.unwrap_or(100).clamp(1, MAX_ACTIVITY_RECORDS);
    let connection = state
        .database
        .lock()
        .map_err(|_| "The local activity database lock is unavailable.".to_string())?;
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

    rows.map(|row| row.map_err(|error| format!("Recent activity row could not be read: {error}")))
        .collect()
}

#[tauri::command]
pub fn record_activity(
    request: RecordActivityRequest,
    state: State<'_, AppState>,
) -> Result<ActivityRecord, String> {
    validate_request(&request)?;
    let mut connection = state
        .database
        .lock()
        .map_err(|_| "The local activity database lock is unavailable.".to_string())?;
    let transaction = connection
        .transaction()
        .map_err(|error| format!("The activity transaction could not start: {error}"))?;

    transaction
        .execute(
            r#"
            INSERT INTO activity_log(id, kind, scope, label, target, occurred_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            ON CONFLICT(id) DO UPDATE SET
                kind = excluded.kind,
                scope = excluded.scope,
                label = excluded.label,
                target = excluded.target,
                occurred_at = excluded.occurred_at
            "#,
            params![
                request.id,
                request.kind,
                request.scope,
                request.label,
                request.target,
                request.occurred_at
            ],
        )
        .map_err(|error| format!("Recent activity could not be recorded: {error}"))?;

    transaction
        .execute(
            r#"
            DELETE FROM activity_log
            WHERE id NOT IN (
                SELECT id
                FROM activity_log
                ORDER BY occurred_at DESC, rowid DESC
                LIMIT ?1
            )
            "#,
            params![MAX_ACTIVITY_RECORDS],
        )
        .map_err(|error| format!("Activity retention could not be applied: {error}"))?;

    transaction
        .commit()
        .map_err(|error| format!("The activity transaction could not commit: {error}"))?;

    Ok(ActivityRecord {
        id: request.id,
        kind: request.kind,
        scope: request.scope,
        label: request.label,
        target: request.target,
        occurred_at: request.occurred_at,
    })
}

#[tauri::command]
pub fn clear_activity(state: State<'_, AppState>) -> Result<usize, String> {
    let connection = state
        .database
        .lock()
        .map_err(|_| "The local activity database lock is unavailable.".to_string())?;
    connection
        .execute("DELETE FROM activity_log", [])
        .map_err(|error| format!("Recent activity could not be cleared: {error}"))
}
