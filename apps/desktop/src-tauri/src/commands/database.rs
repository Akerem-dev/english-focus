use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::State;

use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveVocabularyEntryRequest {
    entry: Value,
    layer: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredVocabularyEntry {
    entry: Value,
    layer: String,
}

fn required_string(entry: &Value, field: &str) -> Result<String, String> {
    entry
        .get(field)
        .and_then(Value::as_str)
        .map(ToOwned::to_owned)
        .ok_or_else(|| format!("Vocabulary entry field '{field}' is required."))
}

fn parse_record(entry_json: String, layer: String) -> Result<StoredVocabularyEntry, String> {
    let entry = serde_json::from_str(&entry_json)
        .map_err(|error| format!("Stored vocabulary JSON is invalid: {error}"))?;
    Ok(StoredVocabularyEntry { entry, layer })
}

#[tauri::command]
pub fn list_vocabulary_entries(
    state: State<'_, AppState>,
) -> Result<Vec<StoredVocabularyEntry>, String> {
    let connection = state
        .database
        .lock()
        .map_err(|_| "The local vocabulary database lock is unavailable.".to_string())?;
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

    rows.map(|row| {
        let (entry_json, layer) =
            row.map_err(|error| format!("Stored vocabulary row could not be read: {error}"))?;
        parse_record(entry_json, layer)
    })
    .collect()
}

#[tauri::command]
pub fn get_vocabulary_entry_by_normalized_word(
    normalized_word: String,
    state: State<'_, AppState>,
) -> Result<Option<StoredVocabularyEntry>, String> {
    let connection = state
        .database
        .lock()
        .map_err(|_| "The local vocabulary database lock is unavailable.".to_string())?;
    let row = connection
        .query_row(
            "SELECT entry_json, layer FROM vocabulary_entries WHERE normalized_word = ?1",
            params![normalized_word],
            |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
        )
        .optional()
        .map_err(|error| format!("The stored vocabulary entry could not be read: {error}"))?;

    row.map(|(entry_json, layer)| parse_record(entry_json, layer))
        .transpose()
}

#[tauri::command]
pub fn save_vocabulary_entry(
    request: SaveVocabularyEntryRequest,
    state: State<'_, AppState>,
) -> Result<StoredVocabularyEntry, String> {
    if request.layer != "user" && request.layer != "override" {
        return Err("Vocabulary storage layer must be 'user' or 'override'.".to_string());
    }

    let entry_id = required_string(&request.entry, "id")?;
    let normalized_word = required_string(&request.entry, "normalizedWord")?;
    let created_at = required_string(&request.entry, "createdAt")?;
    let updated_at = required_string(&request.entry, "updatedAt")?;
    let entry_json = serde_json::to_string(&request.entry)
        .map_err(|error| format!("Vocabulary entry could not be serialized: {error}"))?;
    let mut connection = state
        .database
        .lock()
        .map_err(|_| "The local vocabulary database lock is unavailable.".to_string())?;
    let transaction = connection
        .transaction()
        .map_err(|error| format!("The local vocabulary transaction could not start: {error}"))?;

    transaction
        .execute(
            r#"
            INSERT INTO vocabulary_entries(
                normalized_word, entry_id, layer, entry_json, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            ON CONFLICT(normalized_word) DO UPDATE SET
                entry_id = excluded.entry_id,
                layer = excluded.layer,
                entry_json = excluded.entry_json,
                updated_at = excluded.updated_at
            "#,
            params![
                normalized_word,
                entry_id,
                request.layer,
                entry_json,
                created_at,
                updated_at
            ],
        )
        .map_err(|error| format!("The vocabulary entry could not be saved: {error}"))?;

    transaction
        .execute(
            r#"
            INSERT INTO vocabulary_user_metadata(
                normalized_word, created_at, updated_at
            ) VALUES (?1, ?2, ?3)
            ON CONFLICT(normalized_word) DO NOTHING
            "#,
            params![normalized_word, created_at, updated_at],
        )
        .map_err(|error| format!("Vocabulary metadata could not be initialized: {error}"))?;

    transaction
        .commit()
        .map_err(|error| format!("The local vocabulary transaction could not commit: {error}"))?;

    Ok(StoredVocabularyEntry {
        entry: request.entry,
        layer: request.layer,
    })
}
