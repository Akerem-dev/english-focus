use std::{
    collections::HashSet,
    fs,
    path::{Path, PathBuf},
};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};

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

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupDeletionResult {
    requested: bool,
    deleted_files: usize,
    failed_files: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResetLocalDataResult {
    deleted: LocalDataSnapshot,
    safety_backup: Option<backup::BackupDescriptor>,
    backup_deletion: BackupDeletionResult,
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

fn is_managed_backup_file(path: &Path) -> bool {
    path.file_name()
        .and_then(|value| value.to_str())
        .is_some_and(|file_name| {
            file_name.starts_with("english-focus-backup-") && file_name.ends_with(".json")
        })
}

fn managed_backup_paths(directory: &Path) -> Result<Vec<PathBuf>, String> {
    let mut paths = Vec::new();
    for entry in fs::read_dir(directory)
        .map_err(|error| format!("The backup directory could not be read: {error}"))?
    {
        let entry =
            entry.map_err(|error| format!("A backup directory item is invalid: {error}"))?;
        let file_type = entry
            .file_type()
            .map_err(|error| format!("A backup file type could not be read: {error}"))?;
        let path = entry.path();
        if file_type.is_file() && is_managed_backup_file(&path) {
            paths.push(path);
        }
    }

    paths.sort();
    Ok(paths)
}

fn prepare_backup_deletion(app: &AppHandle) -> Result<Vec<PathBuf>, String> {
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("The application data directory is unavailable: {error}"))?
        .join("backups");
    fs::create_dir_all(&directory)
        .map_err(|error| format!("The backup directory could not be created: {error}"))?;
    managed_backup_paths(&directory)
}

fn delete_prepared_backups(paths: Vec<PathBuf>) -> BackupDeletionResult {
    let mut result = BackupDeletionResult {
        requested: true,
        ..BackupDeletionResult::default()
    };

    for path in paths {
        match fs::remove_file(path) {
            Ok(()) => result.deleted_files += 1,
            Err(_) => result.failed_files += 1,
        }
    }

    result
}

pub fn get_local_data_snapshot(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<LocalDataSnapshot, String> {
    let backup_files = prepare_backup_deletion(&app)?.len();
    let connection = state
        .database
        .lock()
        .map_err(|_| "The local database lock is unavailable for data review.".to_string())?;
    snapshot_from_connection(&connection, backup_files)
}

pub fn reset_local_data(
    request: ResetLocalDataRequest,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<ResetLocalDataResult, String> {
    let categories = validate_request(&request)?;
    let prepared_backups = if categories.contains("backups") {
        Some(prepare_backup_deletion(&app)?)
    } else {
        None
    };
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

    let backup_deletion = prepared_backups
        .map(delete_prepared_backups)
        .unwrap_or_default();
    deleted.backup_files = backup_deletion.deleted_files;

    Ok(ResetLocalDataResult {
        deleted,
        safety_backup,
        backup_deletion,
    })
}

#[cfg(test)]
mod tests {
    use std::{
        fs,
        path::{Path, PathBuf},
        process,
        time::{SystemTime, UNIX_EPOCH},
    };

    use super::{delete_prepared_backups, is_managed_backup_file, managed_backup_paths};

    fn temporary_directory(label: &str) -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after the epoch")
            .as_nanos();
        let directory = std::env::temp_dir().join(format!(
            "english-focus-data-reset-{label}-{}-{nonce}",
            process::id()
        ));
        fs::create_dir_all(&directory).expect("temporary directory should be created");
        directory
    }

    fn write_fixture(directory: &Path, file_name: &str, contents: &str) {
        fs::write(directory.join(file_name), contents).expect("fixture should be written");
    }

    #[test]
    fn recognizes_only_managed_backup_json_files() {
        assert!(is_managed_backup_file(Path::new(
            "english-focus-backup-manual-20260719120000000.json"
        )));
        assert!(!is_managed_backup_file(Path::new("notes.json")));
        assert!(!is_managed_backup_file(Path::new(
            "english-focus-backup-manual-20260719120000000.json.tmp"
        )));
    }

    #[test]
    fn preview_count_and_deletion_use_the_same_managed_backup_set() {
        let directory = temporary_directory("preview-parity");
        let valid_name = "english-focus-backup-manual-valid.json";
        let damaged_name = "english-focus-backup-automatic-damaged.json";

        write_fixture(&directory, valid_name, "{}");
        write_fixture(&directory, damaged_name, "not-json");
        write_fixture(&directory, "notes.json", "{}");
        write_fixture(
            &directory,
            "english-focus-backup-manual-pending.json.tmp",
            "{}",
        );

        let paths =
            managed_backup_paths(&directory).expect("managed backup inventory should be readable");
        assert_eq!(paths.len(), 2);

        let result = delete_prepared_backups(paths);
        assert_eq!(result.deleted_files, 2);
        assert_eq!(result.failed_files, 0);
        assert!(!directory.join(valid_name).exists());
        assert!(!directory.join(damaged_name).exists());
        assert!(directory.join("notes.json").exists());

        fs::remove_dir_all(directory).expect("temporary directory should be removed");
    }
}
