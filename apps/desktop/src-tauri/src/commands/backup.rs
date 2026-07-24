use std::{
    fs,
    fs::OpenOptions,
    io::Write,
    path::{Path, PathBuf},
};

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Manager, State};

use crate::{
    state::AppState,
    validation::{
        validate_app_settings, validate_vocabulary_entry, validate_vocabulary_user_metadata,
    },
};

const BACKUP_KIND: &str = "english-focus-backup";
const BACKUP_VERSION: &str = "1.0.0";
const DATABASE_SCHEMA_VERSION: &str = "3";
const APP_VERSION: &str = env!("CARGO_PKG_VERSION");
const MAX_BACKUP_BYTES: u64 = 32 * 1024 * 1024;
const AUTOMATIC_RETENTION_LIMIT: usize = 7;
const PRE_RESTORE_RETENTION_LIMIT: usize = 5;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BackupCounts {
    vocabulary_entries: usize,
    vocabulary_metadata: usize,
    settings_records: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BackupVocabularyEntry {
    entry: Value,
    layer: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BackupVocabularyMetadata {
    normalized_word: String,
    favorite: bool,
    tags: Value,
    note: String,
    learning_status: String,
    review_status: String,
    last_viewed_at: Option<String>,
    view_count: i64,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BackupData {
    entries: Vec<BackupVocabularyEntry>,
    metadata: Vec<BackupVocabularyMetadata>,
    settings: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BackupManifest {
    kind: String,
    backup_version: String,
    database_schema_version: String,
    app_version: String,
    created_at: String,
    reason: String,
    counts: BackupCounts,
    checksum_algorithm: String,
    checksum: String,
    data: BackupData,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupDescriptor {
    file_name: String,
    created_at: String,
    reason: String,
    size_bytes: u64,
    backup_version: String,
    database_schema_version: String,
    checksum: String,
    counts: BackupCounts,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupValidationResult {
    valid: bool,
    issues: Vec<String>,
    descriptor: Option<BackupDescriptor>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupRestoreResult {
    restored_at: String,
    restored: BackupCounts,
    source_backup: BackupDescriptor,
    safety_backup: Option<BackupDescriptor>,
}

fn backup_directory(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("The application data directory is unavailable: {error}"))?
        .join("backups");
    fs::create_dir_all(&directory)
        .map_err(|error| format!("The backup directory could not be created: {error}"))?;
    Ok(directory)
}

fn validate_reason(reason: &str) -> Result<(), String> {
    if matches!(reason, "manual" | "automatic" | "pre-restore") {
        Ok(())
    } else {
        Err("Backup reason must be manual, automatic, or pre-restore.".to_string())
    }
}

fn validate_file_name(file_name: &str) -> Result<(), String> {
    if file_name.is_empty()
        || file_name.contains('/')
        || file_name.contains('\\')
        || !file_name.starts_with("english-focus-backup-")
        || !file_name.ends_with(".json")
    {
        return Err("The backup file name is not allowed.".to_string());
    }

    Ok(())
}

fn filename_for(reason: &str, created_at: &str) -> String {
    let stamp: String = created_at
        .chars()
        .filter(|character| character.is_ascii_digit())
        .take(17)
        .collect();
    let safe_stamp = if stamp.is_empty() {
        "unknown"
    } else {
        stamp.as_str()
    };
    format!("english-focus-backup-{reason}-{safe_stamp}.json")
}

fn fnv1a64(bytes: &[u8]) -> String {
    let mut hash: u64 = 0xcbf29ce484222325;

    for byte in bytes {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x100000001b3);
    }

    format!("{hash:016x}")
}

fn checksum_for(algorithm: &str, bytes: &[u8]) -> Option<String> {
    match algorithm {
        "sha256" => Some(format!("{:x}", Sha256::digest(bytes))),
        "fnv1a64" => Some(fnv1a64(bytes)),
        _ => None,
    }
}

fn validate_backup_entry(record: &BackupVocabularyEntry) -> Result<(), String> {
    if record.layer != "user" && record.layer != "override" {
        return Err("Stored vocabulary has an invalid storage layer.".to_string());
    }

    validate_vocabulary_entry(&record.entry)
        .map_err(|error| format!("Stored vocabulary cannot be backed up safely: {error}"))
}

fn validate_backup_metadata(record: &BackupVocabularyMetadata) -> Result<(), String> {
    let value = serde_json::to_value(record)
        .map_err(|error| format!("Stored vocabulary metadata is invalid: {error}"))?;
    validate_vocabulary_user_metadata(&value)
        .map_err(|error| format!("Stored vocabulary metadata cannot be backed up safely: {error}"))
}

fn is_current_data_corruption_error(error: &str) -> bool {
    [
        "Stored vocabulary JSON is invalid:",
        "Stored vocabulary has an invalid storage layer.",
        "Stored vocabulary cannot be backed up safely:",
        "Stored metadata tags are invalid:",
        "Stored vocabulary metadata is invalid:",
        "Stored vocabulary metadata cannot be backed up safely:",
        "Stored application settings are invalid:",
        "Stored application settings cannot be backed up safely:",
    ]
    .iter()
    .any(|prefix| error.starts_with(prefix))
}

fn resolve_pre_restore_backup_result(
    result: Result<BackupDescriptor, String>,
) -> Result<Option<BackupDescriptor>, String> {
    match result {
        Ok(descriptor) => Ok(Some(descriptor)),
        Err(error) if is_current_data_corruption_error(&error) => Ok(None),
        Err(error) => Err(error),
    }
}

fn read_vocabulary_entries(connection: &Connection) -> Result<Vec<BackupVocabularyEntry>, String> {
    let mut statement = connection
        .prepare("SELECT entry_json, layer FROM vocabulary_entries ORDER BY normalized_word ASC")
        .map_err(|error| format!("Vocabulary backup query could not be prepared: {error}"))?;
    let rows = statement
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|error| format!("Vocabulary backup query could not run: {error}"))?;

    rows.map(|row| {
        let (entry_json, layer) =
            row.map_err(|error| format!("Vocabulary backup row could not be read: {error}"))?;
        let entry = serde_json::from_str(&entry_json)
            .map_err(|error| format!("Stored vocabulary JSON is invalid: {error}"))?;
        let record = BackupVocabularyEntry { entry, layer };
        validate_backup_entry(&record)?;
        Ok(record)
    })
    .collect()
}

fn read_vocabulary_metadata(
    connection: &Connection,
) -> Result<Vec<BackupVocabularyMetadata>, String> {
    let mut statement = connection
        .prepare(
            r#"
            SELECT
                normalized_word,
                favorite,
                tags_json,
                note,
                learning_status,
                review_status,
                last_viewed_at,
                view_count,
                created_at,
                updated_at
            FROM vocabulary_user_metadata
            ORDER BY normalized_word ASC
            "#,
        )
        .map_err(|error| format!("Metadata backup query could not be prepared: {error}"))?;
    let rows = statement
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, Option<String>>(6)?,
                row.get::<_, i64>(7)?,
                row.get::<_, String>(8)?,
                row.get::<_, String>(9)?,
            ))
        })
        .map_err(|error| format!("Metadata backup query could not run: {error}"))?;

    rows.map(|row| {
        let (
            normalized_word,
            favorite,
            tags_json,
            note,
            learning_status,
            review_status,
            last_viewed_at,
            view_count,
            created_at,
            updated_at,
        ) = row.map_err(|error| format!("Metadata backup row could not be read: {error}"))?;
        let tags = serde_json::from_str(&tags_json)
            .map_err(|error| format!("Stored metadata tags are invalid: {error}"))?;
        let record = BackupVocabularyMetadata {
            normalized_word,
            favorite: favorite != 0,
            tags,
            note,
            learning_status,
            review_status,
            last_viewed_at,
            view_count,
            created_at,
            updated_at,
        };
        validate_backup_metadata(&record)?;
        Ok(record)
    })
    .collect()
}

fn read_settings(connection: &Connection) -> Result<Option<Value>, String> {
    let settings_json = connection
        .query_row(
            "SELECT settings_json FROM app_settings WHERE id = 1",
            [],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|error| format!("Application settings could not be read for backup: {error}"))?;

    settings_json
        .map(|json| {
            let settings: Value = serde_json::from_str(&json)
                .map_err(|error| format!("Stored application settings are invalid: {error}"))?;
            validate_app_settings(&settings).map_err(|error| {
                format!("Stored application settings cannot be backed up safely: {error}")
            })?;
            Ok(settings)
        })
        .transpose()
}

fn build_manifest(
    connection: &Connection,
    reason: &str,
    created_at: &str,
) -> Result<BackupManifest, String> {
    validate_reason(reason)?;
    let data = BackupData {
        entries: read_vocabulary_entries(connection)?,
        metadata: read_vocabulary_metadata(connection)?,
        settings: read_settings(connection)?,
    };
    let counts = BackupCounts {
        vocabulary_entries: data.entries.len(),
        vocabulary_metadata: data.metadata.len(),
        settings_records: usize::from(data.settings.is_some()),
    };
    let checksum_source = serde_json::to_vec(&data)
        .map_err(|error| format!("Backup data could not be serialized: {error}"))?;

    Ok(BackupManifest {
        kind: BACKUP_KIND.to_string(),
        backup_version: BACKUP_VERSION.to_string(),
        database_schema_version: DATABASE_SCHEMA_VERSION.to_string(),
        app_version: APP_VERSION.to_string(),
        created_at: created_at.to_string(),
        reason: reason.to_string(),
        counts,
        checksum_algorithm: "sha256".to_string(),
        checksum: checksum_for("sha256", &checksum_source)
            .ok_or_else(|| "Backup checksum algorithm is unavailable.".to_string())?,
        data,
    })
}

fn serialized_manifest(manifest: &BackupManifest) -> Result<Vec<u8>, String> {
    let contents = serde_json::to_vec_pretty(manifest)
        .map_err(|error| format!("Backup file could not be serialized: {error}"))?;

    if contents.len() as u64 > MAX_BACKUP_BYTES {
        return Err("The backup would exceed the 32 MB safety limit.".to_string());
    }

    Ok(contents)
}

fn descriptor_from_manifest(
    file_name: String,
    size_bytes: u64,
    manifest: &BackupManifest,
) -> BackupDescriptor {
    BackupDescriptor {
        file_name,
        created_at: manifest.created_at.clone(),
        reason: manifest.reason.clone(),
        size_bytes,
        backup_version: manifest.backup_version.clone(),
        database_schema_version: manifest.database_schema_version.clone(),
        checksum: manifest.checksum.clone(),
        counts: manifest.counts.clone(),
    }
}

fn write_manifest(directory: &Path, manifest: &BackupManifest) -> Result<BackupDescriptor, String> {
    let contents = serialized_manifest(manifest)?;
    let file_name = filename_for(&manifest.reason, &manifest.created_at);
    let target = directory.join(&file_name);
    let temporary = directory.join(format!("{file_name}.tmp"));

    if target.exists() {
        return Err(
            "A backup with the same timestamp already exists; the existing file was preserved."
                .to_string(),
        );
    }

    let mut temporary_file = OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(&temporary)
        .map_err(|error| format!("Temporary backup file could not be created: {error}"))?;
    let write_result = temporary_file
        .write_all(&contents)
        .and_then(|_| temporary_file.sync_all());
    drop(temporary_file);

    if let Err(error) = write_result {
        let _ = fs::remove_file(&temporary);
        return Err(format!(
            "Temporary backup file could not be written durably: {error}"
        ));
    }

    if let Err(error) = fs::rename(&temporary, &target) {
        let _ = fs::remove_file(&temporary);
        return Err(format!("Backup file could not be finalized: {error}"));
    }

    Ok(descriptor_from_manifest(
        file_name,
        contents.len() as u64,
        manifest,
    ))
}

fn read_manifest(path: &Path) -> Result<(BackupManifest, u64), String> {
    let metadata = fs::metadata(path)
        .map_err(|error| format!("Backup file metadata could not be read: {error}"))?;

    if metadata.len() > MAX_BACKUP_BYTES {
        return Err("The backup file exceeds the 32 MB safety limit.".to_string());
    }

    let contents =
        fs::read(path).map_err(|error| format!("Backup file could not be read: {error}"))?;

    if contents.len() as u64 > MAX_BACKUP_BYTES {
        return Err("The backup file exceeds the 32 MB safety limit.".to_string());
    }

    let manifest = serde_json::from_slice(&contents)
        .map_err(|error| format!("Backup JSON is invalid: {error}"))?;
    Ok((manifest, metadata.len()))
}

fn manifest_issues(manifest: &BackupManifest) -> Vec<String> {
    let mut issues = Vec::new();

    if manifest.kind != BACKUP_KIND {
        issues.push("The file is not an English Focus backup.".to_string());
    }
    if manifest.backup_version != BACKUP_VERSION {
        issues.push(format!(
            "Backup version {} is not supported.",
            manifest.backup_version
        ));
    }
    if manifest.database_schema_version != "2"
        && manifest.database_schema_version != DATABASE_SCHEMA_VERSION
    {
        issues.push(format!(
            "Database schema {} cannot be restored by this build.",
            manifest.database_schema_version
        ));
    }
    if validate_reason(&manifest.reason).is_err() {
        issues.push("The backup reason is invalid.".to_string());
    }
    if manifest.checksum_algorithm != "sha256" && manifest.checksum_algorithm != "fnv1a64" {
        issues.push("The backup checksum algorithm is not supported.".to_string());
    }

    let expected_counts = BackupCounts {
        vocabulary_entries: manifest.data.entries.len(),
        vocabulary_metadata: manifest.data.metadata.len(),
        settings_records: usize::from(manifest.data.settings.is_some()),
    };
    if manifest.counts.vocabulary_entries != expected_counts.vocabulary_entries
        || manifest.counts.vocabulary_metadata != expected_counts.vocabulary_metadata
        || manifest.counts.settings_records != expected_counts.settings_records
    {
        issues.push("The backup item counts do not match its contents.".to_string());
    }

    match serde_json::to_vec(&manifest.data) {
        Ok(bytes) => match checksum_for(&manifest.checksum_algorithm, &bytes) {
            Some(checksum) if checksum != manifest.checksum => {
                issues.push("The backup checksum does not match its contents.".to_string());
            }
            None => {}
            _ => {}
        },
        Err(error) => issues.push(format!("Backup checksum data is invalid: {error}")),
    }

    for record in &manifest.data.entries {
        if let Err(error) = validate_backup_entry(record) {
            issues.push(error);
            break;
        }
    }

    for record in &manifest.data.metadata {
        if let Err(error) = validate_backup_metadata(record) {
            issues.push(error);
            break;
        }
    }

    if let Some(settings) = &manifest.data.settings {
        if let Err(error) = validate_app_settings(settings) {
            issues.push(format!(
                "The backup application settings are invalid: {error}"
            ));
        }
    }

    issues
}

pub(crate) fn validate_manifest_value(value: &Value) -> Result<(), String> {
    let manifest: BackupManifest = serde_json::from_value(value.clone())
        .map_err(|_| "This backup file is incomplete or damaged.".to_string())?;
    let issues = manifest_issues(&manifest);

    if issues.is_empty() {
        Ok(())
    } else {
        Err(issues.join(" "))
    }
}

fn list_descriptors(directory: &Path) -> Result<Vec<BackupDescriptor>, String> {
    let mut descriptors = Vec::new();

    for entry in fs::read_dir(directory)
        .map_err(|error| format!("The backup directory could not be read: {error}"))?
    {
        let entry =
            entry.map_err(|error| format!("A backup directory item is invalid: {error}"))?;
        let path = entry.path();

        if path.extension().and_then(|value| value.to_str()) != Some("json") {
            continue;
        }

        let Some(file_name) = path.file_name().and_then(|value| value.to_str()) else {
            continue;
        };

        if validate_file_name(file_name).is_err() {
            continue;
        }

        if let Ok((manifest, size_bytes)) = read_manifest(&path) {
            if manifest_issues(&manifest).is_empty() {
                descriptors.push(descriptor_from_manifest(
                    file_name.to_string(),
                    size_bytes,
                    &manifest,
                ));
            }
        }
    }

    descriptors.sort_by(|left, right| right.created_at.cmp(&left.created_at));
    Ok(descriptors)
}

fn apply_retention(directory: &Path) -> Result<(), String> {
    let descriptors = list_descriptors(directory)?;

    for (reason, limit) in [
        ("automatic", AUTOMATIC_RETENTION_LIMIT),
        ("pre-restore", PRE_RESTORE_RETENTION_LIMIT),
    ] {
        for descriptor in descriptors
            .iter()
            .filter(|backup| backup.reason == reason)
            .skip(limit)
        {
            let path = directory.join(&descriptor.file_name);
            fs::remove_file(path)
                .map_err(|error| format!("An expired backup could not be deleted: {error}"))?;
        }
    }

    Ok(())
}

pub(crate) fn create_backup_from_connection(
    connection: &Connection,
    app: &AppHandle,
    reason: &str,
    created_at: &str,
) -> Result<BackupDescriptor, String> {
    let manifest = build_manifest(connection, reason, created_at)?;
    serialized_manifest(&manifest)?;
    let directory = backup_directory(app)?;
    let descriptor = write_manifest(&directory, &manifest)?;
    apply_retention(&directory)?;
    Ok(descriptor)
}

pub fn list_backups(app: AppHandle) -> Result<Vec<BackupDescriptor>, String> {
    let directory = backup_directory(&app)?;
    list_descriptors(&directory)
}

pub fn create_backup(
    reason: String,
    created_at: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<BackupDescriptor, String> {
    let connection = state
        .database
        .lock()
        .map_err(|_| "The local database lock is unavailable for backup.".to_string())?;
    create_backup_from_connection(&connection, &app, &reason, &created_at)
}

pub fn validate_backup(
    file_name: String,
    app: AppHandle,
) -> Result<BackupValidationResult, String> {
    validate_file_name(&file_name)?;
    let path = backup_directory(&app)?.join(&file_name);
    let (manifest, size_bytes) = read_manifest(&path)?;
    let issues = manifest_issues(&manifest);
    let descriptor = descriptor_from_manifest(file_name, size_bytes, &manifest);

    Ok(BackupValidationResult {
        valid: issues.is_empty(),
        issues,
        descriptor: Some(descriptor),
    })
}

pub fn restore_backup(
    file_name: String,
    restored_at: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<BackupRestoreResult, String> {
    validate_file_name(&file_name)?;
    let directory = backup_directory(&app)?;
    let path = directory.join(&file_name);
    let (manifest, size_bytes) = read_manifest(&path)?;
    let issues = manifest_issues(&manifest);

    if !issues.is_empty() {
        return Err(format!(
            "The backup cannot be restored: {}",
            issues.join(" ")
        ));
    }

    let source_backup = descriptor_from_manifest(file_name, size_bytes, &manifest);
    let mut connection = state
        .database
        .lock()
        .map_err(|_| "The local database lock is unavailable for restore.".to_string())?;
    let safety_backup = resolve_pre_restore_backup_result(create_backup_from_connection(
        &connection,
        &app,
        "pre-restore",
        &restored_at,
    ))?;
    let transaction = connection
        .transaction()
        .map_err(|error| format!("The restore transaction could not start: {error}"))?;

    transaction
        .execute("DELETE FROM vocabulary_user_metadata", [])
        .map_err(|error| format!("Existing vocabulary metadata could not be cleared: {error}"))?;
    transaction
        .execute("DELETE FROM vocabulary_entries", [])
        .map_err(|error| format!("Existing vocabulary entries could not be cleared: {error}"))?;
    transaction
        .execute("DELETE FROM app_settings", [])
        .map_err(|error| format!("Existing settings could not be cleared: {error}"))?;

    for record in &manifest.data.entries {
        let entry_id = record
            .entry
            .get("id")
            .and_then(Value::as_str)
            .ok_or_else(|| "A restored vocabulary entry is missing id.".to_string())?;
        let normalized_word = record
            .entry
            .get("normalizedWord")
            .and_then(Value::as_str)
            .ok_or_else(|| "A restored vocabulary entry is missing normalizedWord.".to_string())?;
        let created_at = record
            .entry
            .get("createdAt")
            .and_then(Value::as_str)
            .ok_or_else(|| "A restored vocabulary entry is missing createdAt.".to_string())?;
        let updated_at = record
            .entry
            .get("updatedAt")
            .and_then(Value::as_str)
            .ok_or_else(|| "A restored vocabulary entry is missing updatedAt.".to_string())?;
        let entry_json = serde_json::to_string(&record.entry)
            .map_err(|error| format!("A restored vocabulary entry is invalid: {error}"))?;

        transaction
            .execute(
                r#"
                INSERT INTO vocabulary_entries(
                    normalized_word, entry_id, layer, entry_json, created_at, updated_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
                "#,
                params![
                    normalized_word,
                    entry_id,
                    record.layer,
                    entry_json,
                    created_at,
                    updated_at
                ],
            )
            .map_err(|error| format!("A vocabulary entry could not be restored: {error}"))?;
    }

    for record in &manifest.data.metadata {
        let tags_json = serde_json::to_string(&record.tags)
            .map_err(|error| format!("Restored vocabulary tags are invalid: {error}"))?;
        transaction
            .execute(
                r#"
                INSERT INTO vocabulary_user_metadata(
                    normalized_word,
                    favorite,
                    tags_json,
                    note,
                    learning_status,
                    review_status,
                    last_viewed_at,
                    view_count,
                    created_at,
                    updated_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
                "#,
                params![
                    record.normalized_word,
                    if record.favorite { 1 } else { 0 },
                    tags_json,
                    record.note,
                    record.learning_status,
                    record.review_status,
                    record.last_viewed_at,
                    record.view_count,
                    record.created_at,
                    record.updated_at,
                ],
            )
            .map_err(|error| format!("Vocabulary metadata could not be restored: {error}"))?;
    }

    if let Some(settings) = &manifest.data.settings {
        let settings_json = serde_json::to_string(settings)
            .map_err(|error| format!("Restored application settings are invalid: {error}"))?;
        let updated_at = settings
            .get("updatedAt")
            .and_then(Value::as_str)
            .ok_or_else(|| "Restored application settings are missing updatedAt.".to_string())?;
        transaction
            .execute(
                "INSERT INTO app_settings(id, settings_json, updated_at) VALUES (1, ?1, ?2)",
                params![settings_json, updated_at],
            )
            .map_err(|error| format!("Application settings could not be restored: {error}"))?;
    }

    transaction
        .commit()
        .map_err(|error| format!("The restore transaction could not commit: {error}"))?;

    Ok(BackupRestoreResult {
        restored_at,
        restored: manifest.counts,
        source_backup,
        safety_backup,
    })
}

#[tauri::command]
pub fn delete_backup(file_name: String, app: AppHandle) -> Result<(), String> {
    validate_file_name(&file_name)?;
    let path = backup_directory(&app)?.join(file_name);
    fs::remove_file(path).map_err(|error| format!("The backup could not be deleted: {error}"))
}

#[cfg(test)]
mod tests {
    use std::{
        fs,
        path::{Path, PathBuf},
        process,
        time::{SystemTime, UNIX_EPOCH},
    };

    use rusqlite::{params, Connection};
    use serde_json::{json, Value};

    use super::{
        apply_retention, build_manifest, checksum_for, list_descriptors,
        resolve_pre_restore_backup_result, serialized_manifest, write_manifest, BackupCounts,
        BackupData, BackupManifest, BackupVocabularyEntry, BACKUP_KIND, BACKUP_VERSION,
        DATABASE_SCHEMA_VERSION, MAX_BACKUP_BYTES,
    };

    fn create_required_tables(connection: &Connection) {
        connection
            .execute_batch(
                r#"
                CREATE TABLE vocabulary_entries (
                    normalized_word TEXT PRIMARY KEY,
                    entry_id TEXT NOT NULL,
                    layer TEXT NOT NULL,
                    entry_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE vocabulary_user_metadata (
                    normalized_word TEXT PRIMARY KEY,
                    favorite INTEGER NOT NULL,
                    tags_json TEXT NOT NULL,
                    note TEXT NOT NULL,
                    learning_status TEXT NOT NULL,
                    review_status TEXT NOT NULL,
                    last_viewed_at TEXT,
                    view_count INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE app_settings (
                    id INTEGER PRIMARY KEY,
                    settings_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                "#,
            )
            .expect("backup test tables should be created");
    }

    fn bundled_entry() -> Value {
        serde_json::from_str(include_str!(
            "../../../src/content/core/entries/maintain.entry.json"
        ))
        .expect("bundled entry should be valid JSON")
    }

    fn manifest(reason: &str, created_at: &str) -> BackupManifest {
        let data = BackupData {
            entries: vec![BackupVocabularyEntry {
                entry: bundled_entry(),
                layer: "user".to_string(),
            }],
            metadata: Vec::new(),
            settings: None,
        };
        let checksum_source = serde_json::to_vec(&data).expect("test backup data should serialize");

        BackupManifest {
            kind: BACKUP_KIND.to_string(),
            backup_version: BACKUP_VERSION.to_string(),
            database_schema_version: DATABASE_SCHEMA_VERSION.to_string(),
            app_version: "1.0.0".to_string(),
            created_at: created_at.to_string(),
            reason: reason.to_string(),
            counts: BackupCounts {
                vocabulary_entries: 1,
                vocabulary_metadata: 0,
                settings_records: 0,
            },
            checksum_algorithm: "sha256".to_string(),
            checksum: checksum_for("sha256", &checksum_source).expect("sha256 should be available"),
            data,
        }
    }

    fn temporary_directory(label: &str) -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after the epoch")
            .as_nanos();
        let directory =
            std::env::temp_dir().join(format!("english-focus-{label}-{}-{nonce}", process::id()));
        fs::create_dir_all(&directory).expect("temporary backup directory should be created");
        directory
    }

    fn remove_directory(directory: &Path) {
        let _ = fs::remove_dir_all(directory);
    }

    #[test]
    fn calculates_sha256_for_new_backups() {
        assert_eq!(
            checksum_for("sha256", b"abc").as_deref(),
            Some("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
        );
    }

    #[test]
    fn retains_legacy_fnv_checksum_support() {
        assert_eq!(
            checksum_for("fnv1a64", b"abc").as_deref(),
            Some("e71fa2190541574b")
        );
    }

    #[test]
    fn rejects_unknown_checksum_algorithms() {
        assert!(checksum_for("md5", b"abc").is_none());
    }

    #[test]
    fn current_data_corruption_can_skip_the_pre_restore_safety_backup() {
        let result = resolve_pre_restore_backup_result(Err(
            "Stored vocabulary JSON is invalid: expected value".to_string(),
        ))
        .expect("current-data corruption should not block a validated restore");

        assert!(result.is_none());
    }

    #[test]
    fn operational_safety_backup_failures_still_stop_restore() {
        let error = resolve_pre_restore_backup_result(Err(
            "Temporary backup file could not be written durably: access denied".to_string(),
        ))
        .expect_err("operational backup failures must still abort restore");

        assert!(error.contains("could not be written durably"));
    }

    #[test]
    fn rejects_schema_invalid_vocabulary_before_a_backup_is_written() {
        let connection = Connection::open_in_memory().expect("in-memory database should open");
        create_required_tables(&connection);
        connection
            .execute(
                r#"
                INSERT INTO vocabulary_entries(
                    normalized_word, entry_id, layer, entry_json, created_at, updated_at
                ) VALUES (?1, ?2, 'user', ?3, ?4, ?4)
                "#,
                params![
                    "broken",
                    "word:broken",
                    json!({
                        "schemaVersion": "1.0.0",
                        "id": "word:broken",
                        "word": "broken",
                        "normalizedWord": "broken"
                    })
                    .to_string(),
                    "2026-07-21T12:00:00.000Z"
                ],
            )
            .expect("invalid vocabulary fixture should be inserted");

        let error = build_manifest(&connection, "manual", "2026-07-21T12:00:00.000Z")
            .expect_err("schema-invalid vocabulary must stop backup creation");

        assert!(error.contains("cannot be backed up safely"));
    }

    #[test]
    fn rejects_a_backup_larger_than_32_mb_before_creating_a_file() {
        let directory = temporary_directory("oversized-backup");
        let mut oversized = manifest("manual", "2026-07-21T12:01:00.000Z");
        oversized.data.entries[0].entry["word"] =
            Value::String("x".repeat(MAX_BACKUP_BYTES as usize));

        let error = write_manifest(&directory, &oversized)
            .expect_err("oversized backups must be rejected before writing");

        assert!(error.contains("32 MB"));
        assert_eq!(
            fs::read_dir(&directory)
                .expect("temporary directory should remain readable")
                .count(),
            0
        );
        remove_directory(&directory);
    }

    #[test]
    fn excludes_semantically_invalid_manifests_from_the_available_list() {
        let directory = temporary_directory("invalid-manifest");
        let mut invalid = manifest("automatic", "2026-07-21T12:02:00.000Z");
        invalid.checksum = "0".repeat(64);
        let path = directory.join("english-focus-backup-automatic-invalid.json");
        fs::write(
            &path,
            serde_json::to_vec_pretty(&invalid).expect("invalid fixture should serialize"),
        )
        .expect("invalid fixture should be written");

        let descriptors =
            list_descriptors(&directory).expect("backup inventory should remain readable");

        assert!(descriptors.is_empty());
        assert!(path.exists());
        remove_directory(&directory);
    }

    #[test]
    fn retention_counts_only_integrity_checked_backups() {
        let directory = temporary_directory("retention-integrity");

        for day in 1..=8 {
            let created_at = format!("2026-07-{day:02}T12:00:00.000Z");
            write_manifest(&directory, &manifest("automatic", &created_at))
                .expect("valid automatic backup should be written");
        }

        let mut invalid = manifest("automatic", "2026-07-21T12:03:00.000Z");
        invalid.counts.vocabulary_entries = 99;
        let invalid_path = directory.join("english-focus-backup-automatic-corrupt.json");
        fs::write(
            &invalid_path,
            serde_json::to_vec_pretty(&invalid).expect("invalid fixture should serialize"),
        )
        .expect("invalid fixture should be written");

        apply_retention(&directory).expect("retention should process valid backups");
        let descriptors =
            list_descriptors(&directory).expect("valid backup inventory should remain readable");

        assert_eq!(descriptors.len(), 7);
        assert!(invalid_path.exists());
        remove_directory(&directory);
    }

    #[test]
    fn serialized_limit_matches_the_public_32_mb_boundary() {
        let backup = manifest("manual", "2026-07-21T12:04:00.000Z");
        let bytes =
            serialized_manifest(&backup).expect("normal backup should remain below the limit");

        assert!((bytes.len() as u64) < MAX_BACKUP_BYTES);
    }
}
