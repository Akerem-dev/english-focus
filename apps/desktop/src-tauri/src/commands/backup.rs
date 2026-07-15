use std::{
    fs,
    path::{Path, PathBuf},
};

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, Manager, State};

use crate::state::AppState;

const BACKUP_KIND: &str = "english-focus-backup";
const BACKUP_VERSION: &str = "1.0.0";
const DATABASE_SCHEMA_VERSION: &str = "2";
const APP_VERSION: &str = "0.1.0";
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
    safety_backup: BackupDescriptor,
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
    if reason == "manual" || reason == "automatic" || reason == "pre-restore" {
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
    let safe_stamp = if stamp.is_empty() { "unknown" } else { stamp.as_str() };
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

fn read_vocabulary_entries(connection: &Connection) -> Result<Vec<BackupVocabularyEntry>, String> {
    let mut statement = connection
        .prepare("SELECT entry_json, layer FROM vocabulary_entries ORDER BY normalized_word ASC")
        .map_err(|error| format!("Vocabulary backup query could not be prepared: {error}"))?;
    let rows = statement
        .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)))
        .map_err(|error| format!("Vocabulary backup query could not run: {error}"))?;

    rows.map(|row| {
        let (entry_json, layer) =
            row.map_err(|error| format!("Vocabulary backup row could not be read: {error}"))?;
        let entry = serde_json::from_str(&entry_json)
            .map_err(|error| format!("Stored vocabulary JSON is invalid: {error}"))?;
        Ok(BackupVocabularyEntry { entry, layer })
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

        Ok(BackupVocabularyMetadata {
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
        })
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
            serde_json::from_str(&json)
                .map_err(|error| format!("Stored application settings are invalid: {error}"))
        })
        .transpose()
}

fn build_manifest(
    connection: &Connection,
    reason: &str,
    created_at: &str,
) -> Result<BackupManifest, String> {
    let data = BackupData {
        entries: read_vocabulary_entries(connection)?,
        metadata: read_vocabulary_metadata(connection)?,
        settings: read_settings(connection)?,
    };
    let counts = BackupCounts {
        vocabulary_entries: data.entries.len(),
        vocabulary_metadata: data.metadata.len(),
        settings_records: if data.settings.is_some() { 1 } else { 0 },
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
        checksum_algorithm: "fnv1a64".to_string(),
        checksum: fnv1a64(&checksum_source),
        data,
    })
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
    let file_name = filename_for(&manifest.reason, &manifest.created_at);
    let target = directory.join(&file_name);
    let temporary = directory.join(format!("{file_name}.tmp"));
    let contents = serde_json::to_vec_pretty(manifest)
        .map_err(|error| format!("Backup file could not be serialized: {error}"))?;

    fs::write(&temporary, &contents)
        .map_err(|error| format!("Temporary backup file could not be written: {error}"))?;
    if target.exists() {
        fs::remove_file(&target)
            .map_err(|error| format!("An older backup file could not be replaced: {error}"))?;
    }
    fs::rename(&temporary, &target)
        .map_err(|error| format!("Backup file could not be finalized: {error}"))?;

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

    let contents = fs::read(path)
        .map_err(|error| format!("Backup file could not be read: {error}"))?;
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
    if manifest.database_schema_version != DATABASE_SCHEMA_VERSION {
        issues.push(format!(
            "Database schema {} cannot be restored by this build.",
            manifest.database_schema_version
        ));
    }
    if validate_reason(&manifest.reason).is_err() {
        issues.push("The backup reason is invalid.".to_string());
    }
    if manifest.checksum_algorithm != "fnv1a64" {
        issues.push("The backup checksum algorithm is not supported.".to_string());
    }

    let expected_counts = BackupCounts {
        vocabulary_entries: manifest.data.entries.len(),
        vocabulary_metadata: manifest.data.metadata.len(),
        settings_records: if manifest.data.settings.is_some() { 1 } else { 0 },
    };
    if manifest.counts.vocabulary_entries != expected_counts.vocabulary_entries
        || manifest.counts.vocabulary_metadata != expected_counts.vocabulary_metadata
        || manifest.counts.settings_records != expected_counts.settings_records
    {
        issues.push("The backup item counts do not match its contents.".to_string());
    }

    match serde_json::to_vec(&manifest.data) {
        Ok(bytes) if fnv1a64(&bytes) != manifest.checksum => {
            issues.push("The backup checksum does not match its contents.".to_string());
        }
        Err(error) => issues.push(format!("Backup checksum data is invalid: {error}")),
        _ => {}
    }

    for record in &manifest.data.entries {
        if record.layer != "user" && record.layer != "override" {
            issues.push("A vocabulary record has an invalid storage layer.".to_string());
            break;
        }

        for field in ["id", "normalizedWord", "createdAt", "updatedAt"] {
            if record.entry.get(field).and_then(Value::as_str).is_none() {
                issues.push(format!("A vocabulary record is missing {field}."));
                break;
            }
        }
    }

    for record in &manifest.data.metadata {
        if record.normalized_word.trim().is_empty() || record.view_count < 0 {
            issues.push("A vocabulary metadata record is invalid.".to_string());
            break;
        }
    }

    if let Some(settings) = &manifest.data.settings {
        if !settings.is_object() || settings.get("updatedAt").and_then(Value::as_str).is_none() {
            issues.push("The backup application settings are invalid.".to_string());
        }
    }

    issues
}

fn list_descriptors(directory: &Path) -> Result<Vec<BackupDescriptor>, String> {
    let mut descriptors = Vec::new();

    for entry in fs::read_dir(directory)
        .map_err(|error| format!("The backup directory could not be read: {error}"))?
    {
        let entry = entry.map_err(|error| format!("A backup directory item is invalid: {error}"))?;
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
            descriptors.push(descriptor_from_manifest(
                file_name.to_string(),
                size_bytes,
                &manifest,
            ));
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

fn create_backup_from_connection(
    connection: &Connection,
    app: &AppHandle,
    reason: &str,
    created_at: &str,
) -> Result<BackupDescriptor, String> {
    validate_reason(reason)?;
    let directory = backup_directory(app)?;
    let manifest = build_manifest(connection, reason, created_at)?;
    let descriptor = write_manifest(&directory, &manifest)?;
    apply_retention(&directory)?;
    Ok(descriptor)
}

#[tauri::command]
pub fn list_backups(app: AppHandle) -> Result<Vec<BackupDescriptor>, String> {
    let directory = backup_directory(&app)?;
    list_descriptors(&directory)
}

#[tauri::command]
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

#[tauri::command]
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

#[tauri::command]
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
    let safety_backup =
        create_backup_from_connection(&connection, &app, "pre-restore", &restored_at)?;
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
