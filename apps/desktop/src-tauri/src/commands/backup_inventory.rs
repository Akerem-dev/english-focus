use std::{
    fs,
    path::{Path, PathBuf},
};

use serde::Serialize;
use serde_json::{Map, Value};
use tauri::{AppHandle, Manager};

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

fn has_string(object: &Map<String, Value>, key: &str) -> bool {
    object.get(key).is_some_and(Value::is_string)
}

fn has_nonnegative_integer(object: &Map<String, Value>, key: &str) -> bool {
    object.get(key).and_then(Value::as_u64).is_some()
}

fn is_supported_checksum(value: &str) -> bool {
    (value.len() == 16 || value.len() == 64)
        && value
            .chars()
            .all(|character| matches!(character, '0'..='9' | 'a'..='f'))
}

fn is_readable_manifest_shape(value: &Value) -> bool {
    let Some(manifest) = value.as_object() else {
        return false;
    };

    for key in [
        "kind",
        "backupVersion",
        "databaseSchemaVersion",
        "appVersion",
        "createdAt",
        "reason",
        "checksumAlgorithm",
        "checksum",
    ] {
        if !has_string(manifest, key) {
            return false;
        }
    }

    if manifest.get("kind").and_then(Value::as_str) != Some("english-focus-backup")
        || manifest.get("backupVersion").and_then(Value::as_str) != Some("1.0.0")
        || !matches!(
            manifest.get("databaseSchemaVersion").and_then(Value::as_str),
            Some("2" | "3")
        )
        || !matches!(
            manifest.get("reason").and_then(Value::as_str),
            Some("manual" | "automatic" | "pre-restore")
        )
        || !matches!(
            manifest.get("checksumAlgorithm").and_then(Value::as_str),
            Some("sha256" | "fnv1a64")
        )
        || !manifest
            .get("checksum")
            .and_then(Value::as_str)
            .is_some_and(is_supported_checksum)
    {
        return false;
    }

    let Some(counts) = manifest.get("counts").and_then(Value::as_object) else {
        return false;
    };
    if ![
        "vocabularyEntries",
        "vocabularyMetadata",
        "settingsRecords",
    ]
    .iter()
    .all(|key| has_nonnegative_integer(counts, key))
    {
        return false;
    }

    let Some(data) = manifest.get("data").and_then(Value::as_object) else {
        return false;
    };

    data.get("entries").is_some_and(Value::is_array)
        && data.get("metadata").is_some_and(Value::is_array)
        && data.contains_key("settings")
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
                Ok(value) if is_readable_manifest_shape(&value) => None,
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

#[tauri::command]
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

    use super::{
        is_readable_manifest_shape, is_supported_checksum, recognized_backup_file_name,
        safe_json_file_name,
    };

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
    fn accepts_only_supported_checksum_shapes() {
        assert!(is_supported_checksum("0123456789abcdef"));
        assert!(is_supported_checksum(
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
        ));
        assert!(!is_supported_checksum("broken"));
    }

    #[test]
    fn recognizes_the_current_manifest_shape() {
        let manifest = json!({
            "kind": "english-focus-backup",
            "backupVersion": "1.0.0",
            "databaseSchemaVersion": "3",
            "appVersion": "1.0.0",
            "createdAt": "2026-07-19T12:00:00.000Z",
            "reason": "manual",
            "counts": {
                "vocabularyEntries": 0,
                "vocabularyMetadata": 0,
                "settingsRecords": 1
            },
            "checksumAlgorithm": "sha256",
            "checksum": "0123456789abcdef",
            "data": {
                "entries": [],
                "metadata": [],
                "settings": null
            }
        });

        assert!(is_readable_manifest_shape(&manifest));
        assert!(!is_readable_manifest_shape(&json!({
            "kind": "english-focus-backup"
        })));
        assert!(!is_readable_manifest_shape(&json!({
            "kind": "english-focus-backup",
            "backupVersion": "99",
            "databaseSchemaVersion": "3",
            "appVersion": "1.0.0",
            "createdAt": "2026-07-19T12:00:00.000Z",
            "reason": "manual",
            "counts": {
                "vocabularyEntries": 0,
                "vocabularyMetadata": 0,
                "settingsRecords": 1
            },
            "checksumAlgorithm": "sha256",
            "checksum": "0123456789abcdef",
            "data": {
                "entries": [],
                "metadata": [],
                "settings": null
            }
        })));
    }
}
