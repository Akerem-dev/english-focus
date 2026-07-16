use std::collections::HashSet;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use crate::{commands::backup, state::AppState};

const ALLOWED_CATEGORIES: [&str; 6] = [
    "study-metadata",
    "user-vocabulary",
    "overrides",
    "settings",
    "activity",
    "backups",
];

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalDataSnapshot {
    study_metadata_records: usize,
    user_vocabulary_entries: usize,
    override_vocabulary_entries: usize,
    settings_records: usize,
    activity_records: usize,
    backup_files: usize,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResetLocalDataRequest {
    categories: Vec<String>,
    create_safety_backup: bool,
    requested_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResetLocalDataResult {
    deleted: LocalDataSnapshot,
    safety_backup: Option<backup::BackupDescriptor>,
}

fn count_query(connection: &rusqlite::Connection, sql: &str) -> Result<usize, String> {
    connection
        .query_row(sql, [], |row| row.get::<_, i64>(0))
        .map(|count| count.max(0) as usize)
        .map_err(|error| format!("Local data counts could not be read: {error}"))
}

fn validate_request(request: &ResetLocalDataRequest) -> Result<HashSet<&str>, String> {
    if request.categories.is_empty() {
        return Err("Choose at least one local data category to remove.".to_string());
    }

    if request.requested_at.trim().is_empty() {
        return Err("A reset timestamp is required.".to_string());
    }

    let mut categories = HashSet::new();
    for category in &request.categories {
        if !ALLOWED_CATEGORIES.contains(&category.as_str()) {
            return Err(format!(
                "Local data category '{category}' is not supported."
            ));
        }
        categories.insert(category.as_str());
    }

    if categories.contains("backups") && request.create_safety_backup {
        return Err(
            "A safety backup cannot be created while retained backups are being deleted."
                .to_string(),
        );
    }

    Ok(categories)
}

fn snapshot_from_connection(
    connection: &rusqlite::Connection,
    backup_files: usize,
) -> Result<LocalDataSnapshot, String> {
    Ok(LocalDataSnapshot {
        study_metadata_records: count_query(
            connection,
            "SELECT COUNT(*) FROM vocabulary_user_metadata",
        )?,
        user_vocabulary_entries: count_query(
            connection,
            "SELECT COUNT(*) FROM vocabulary_entries WHERE layer = 'user'",
        )?,
        override_vocabulary_entries: count_query(
            connection,
            "SELECT COUNT(*) FROM vocabulary_entries WHERE layer = 'override'",
        )?,
        settings_records: count_query(connection, "SELECT COUNT(*) FROM app_settings")?,
        activity_records: count_query(connection, "SELECT COUNT(*) FROM activity_log")?,
        backup_files,
    })
}

#[tauri::command]
pub fn get_local_data_snapshot(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<LocalDataSnapshot, String> {
    let backup_files = backup::count_backups(&app)?;
    let connection = state
        .database
        .lock()
        .map_err(|_| "The local database lock is unavailable for data review.".to_string())?;
    snapshot_from_connection(&connection, backup_files)
}

#[tauri::command]
pub fn reset_local_data(
    request: ResetLocalDataRequest,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<ResetLocalDataResult, String> {
    let categories = validate_request(&request)?;
    let mut deleted = LocalDataSnapshot::default();
    let mut connection = state
        .database
        .lock()
        .map_err(|_| "The local database lock is unavailable for data removal.".to_string())?;

    let backs_up_database_data = categories.iter().any(|category| {
        matches!(
            *category,
            "study-metadata" | "user-vocabulary" | "overrides" | "settings"
        )
    });
    let safety_backup = if request.create_safety_backup && backs_up_database_data {
        Some(backup::create_backup_from_connection(
            &connection,
            &app,
            "pre-restore",
            &request.requested_at,
        )?)
    } else {
        None
    };

    let transaction = connection
        .transaction()
        .map_err(|error| format!("The local data transaction could not start: {error}"))?;

    if categories.contains("study-metadata") {
        deleted.study_metadata_records = transaction
            .execute("DELETE FROM vocabulary_user_metadata", [])
            .map_err(|error| format!("Study details could not be removed: {error}"))?;
    } else if categories.contains("user-vocabulary") {
        deleted.study_metadata_records = transaction
            .execute(
                r#"
                DELETE FROM vocabulary_user_metadata
                WHERE normalized_word IN (
                    SELECT normalized_word FROM vocabulary_entries WHERE layer = 'user'
                )
                "#,
                [],
            )
            .map_err(|error| {
                format!("Metadata linked to user vocabulary could not be removed: {error}")
            })?;
    }

    if categories.contains("user-vocabulary") {
        deleted.user_vocabulary_entries = transaction
            .execute("DELETE FROM vocabulary_entries WHERE layer = 'user'", [])
            .map_err(|error| format!("User vocabulary could not be removed: {error}"))?;
    }

    if categories.contains("overrides") {
        deleted.override_vocabulary_entries = transaction
            .execute(
                "DELETE FROM vocabulary_entries WHERE layer = 'override'",
                [],
            )
            .map_err(|error| format!("Vocabulary overrides could not be removed: {error}"))?;
    }

    if categories.contains("settings") {
        deleted.settings_records = transaction
            .execute("DELETE FROM app_settings", [])
            .map_err(|error| format!("Application settings could not be reset: {error}"))?;
    }

    if categories.contains("activity") {
        deleted.activity_records = transaction
            .execute("DELETE FROM activity_log", [])
            .map_err(|error| format!("Activity history could not be removed: {error}"))?;
    }

    transaction
        .commit()
        .map_err(|error| format!("The local data transaction could not commit: {error}"))?;
    drop(connection);

    if categories.contains("backups") {
        deleted.backup_files = backup::delete_all_backups(&app)?;
    }

    Ok(ResetLocalDataResult {
        deleted,
        safety_backup,
    })
}
