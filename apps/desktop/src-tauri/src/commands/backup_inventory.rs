use std::{
    fs,
    path::{Path, PathBuf},
};

use serde::Serialize;
use serde_json::Value;
use tauri::{AppHandle, Manager};

use crate::commands::backup;

const MAX_BACKUP_BYTES: u64 = 32 * 1024 * 1024;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UnavailableBackup {
    file_name: String,
    size_bytes: u64,
    issue: String,
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

fn safe_json_file_name(file_name: &str) -> bool {
    !file_name.is_empty()
        && !file_name.contains('/')
        && !file_name.contains('\\')
        && file_name.ends_with(".json")
}

fn recognized_backup_file_name(file_name: &str) -> bool {
    safe_json_file_name(file_name) && file_name.starts_with("english-focus-backup-")
}

fn classify_unavailable(path: &Path) -> Result<Option<UnavailableBackup>, String> {
    let Some(file_name) = path.file_name().and_then(|value| value.to_str()) else {
        return Ok(None);
    };

    if !safe_json_file_name(file_name) {
        return Ok(None);
    }

    let metadata = fs::metadata(path)
        .map_err(|error| format!("Backup file metadata could not be read: {error}"))?;
    if !metadata.is_file() {
        return Ok(None);
    }

    let issue = if !recognized_backup_file_name(file_name) {
        Some("This file is not recognized as an English Focus backup.")
    } else if metadata.len() > MAX_BACKUP_BYTES {
        Some("This backup file is too large to open safely.")
    } else {
        match fs::read(path) {
            Ok(contents) => match serde_json::from_slice::<Value>(&contents) {
                Ok(value) if backup::validate_manifest_value(&value).is_ok() => None,
                Ok(_) | Err(_) => Some("This backup file is incomplete or damaged."),
            },
            Err(_) => Some("This backup file could not be read."),
        }
    };

    Ok(issue.map(|issue| UnavailableBackup {
        file_name: file_name.to_string(),
        size_bytes: metadata.len(),
        issue: issue.to_string(),
    }))
}

pub fn list_unavailable_backups(app: AppHandle) -> Result<Vec<UnavailableBackup>, String> {
    let directory = backup_directory(&app)?;
    let mut unavailable = Vec::new();

    for entry in fs::read_dir(directory)
        .map_err(|error| format!("The backup directory could not be read: {error}"))?
    {
        let Ok(entry) = entry else {
            continue;
        };
        let path = entry.path();
        if path.extension().and_then(|value| value.to_str()) != Some("json") {
            continue;
        }

        if let Ok(Some(file)) = classify_unavailable(&path) {
            unavailable.push(file);
        }
    }

    unavailable.sort_by(|left, right| left.file_name.cmp(&right.file_name));
    Ok(unavailable)
}

#[tauri::command]
pub fn delete_unavailable_backup(file_name: String, app: AppHandle) -> Result<(), String> {
    if !safe_json_file_name(&file_name) {
        return Err("The backup file name is not allowed.".to_string());
    }

    let path = backup_directory(&app)?.join(&file_name);
    if classify_unavailable(&path)?.is_none() {
        return Err("This file is not an unavailable backup file.".to_string());
    }

    fs::remove_file(path)
        .map_err(|error| format!("The unavailable backup file could not be removed: {error}"))
}

#[cfg(test)]
mod tests {
    use serde_json::json;
    use sha2::{Digest, Sha256};

    use super::{recognized_backup_file_name, safe_json_file_name};
    use crate::commands::backup;

    fn valid_empty_manifest() -> serde_json::Value {
        let data = json!({
            "entries": [],
            "metadata": [],
            "settings": null
        });
        let checksum = format!(
            "{:x}",
            Sha256::digest(serde_json::to_vec(&data).expect("empty backup data should serialize"))
        );

        json!({
            "kind": "english-focus-backup",
            "backupVersion": "1.0.0",
            "databaseSchemaVersion": "3",
            "appVersion": "1.0.0",
            "createdAt": "2026-07-21T12:00:00.000Z",
            "reason": "manual",
            "counts": {
                "vocabularyEntries": 0,
                "vocabularyMetadata": 0,
                "settingsRecords": 0
            },
            "checksumAlgorithm": "sha256",
            "checksum": checksum,
            "data": data
        })
    }

    #[test]
    fn accepts_only_safe_json_file_names() {
        assert!(safe_json_file_name("damaged.json"));
        assert!(!safe_json_file_name("../damaged.json"));
        assert!(!safe_json_file_name("damaged.json.tmp"));
    }

    #[test]
    fn recognizes_managed_backup_names() {
        assert!(recognized_backup_file_name(
            "english-focus-backup-manual-20260719120000000.json"
        ));
        assert!(!recognized_backup_file_name("notes.json"));
    }

    #[test]
    fn classifies_semantically_invalid_manifests_as_unavailable() {
        let valid = valid_empty_manifest();
        backup::validate_manifest_value(&valid)
            .expect("valid empty backup should pass integrity validation");

        let mut invalid = valid;
        invalid["counts"]["settingsRecords"] = json!(1);

        assert!(backup::validate_manifest_value(&invalid).is_err());
    }
}
