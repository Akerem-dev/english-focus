use std::collections::HashSet;

use rusqlite::{params, OptionalExtension, Transaction};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::State;

use crate::state::AppState;
use crate::validation::{validate_vocabulary_entry, validate_vocabulary_user_metadata};

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
    validate_vocabulary_entry(&entry)
        .map_err(|error| format!("Stored vocabulary entry is invalid: {error}"))?;
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
    save_vocabulary_entries(vec![request], state)?
        .into_iter()
        .next()
        .ok_or_else(|| "The vocabulary entry was not saved.".to_string())
}

fn validate_save_request(request: &SaveVocabularyEntryRequest) -> Result<(), String> {
    if request.layer != "user" && request.layer != "override" {
        return Err("Vocabulary storage layer must be 'user' or 'override'.".to_string());
    }

    validate_vocabulary_entry(&request.entry)
}

fn persist_vocabulary_entry(
    transaction: &Transaction<'_>,
    request: &SaveVocabularyEntryRequest,
) -> Result<(), String> {
    let entry_id = required_string(&request.entry, "id")?;
    let normalized_word = required_string(&request.entry, "normalizedWord")?;
    let created_at = required_string(&request.entry, "createdAt")?;
    let updated_at = required_string(&request.entry, "updatedAt")?;
    let entry_json = serde_json::to_string(&request.entry)
        .map_err(|error| format!("Vocabulary entry could not be serialized: {error}"))?;
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

    Ok(())
}

#[tauri::command]
pub fn save_vocabulary_entries(
    requests: Vec<SaveVocabularyEntryRequest>,
    state: State<'_, AppState>,
) -> Result<Vec<StoredVocabularyEntry>, String> {
    if requests.is_empty() {
        return Err("At least one vocabulary entry is required.".to_string());
    }
    if requests.len() > 500 {
        return Err("At most 500 vocabulary entries can be saved in one transaction.".to_string());
    }

    let mut normalized_words = HashSet::new();
    for request in &requests {
        validate_save_request(request)?;
        let normalized_word = required_string(&request.entry, "normalizedWord")?;
        if !normalized_words.insert(normalized_word.clone()) {
            return Err(format!(
                "Vocabulary entry '{normalized_word}' appears more than once in the transaction."
            ));
        }
    }

    let mut connection = state
        .database
        .lock()
        .map_err(|_| "The local vocabulary database lock is unavailable.".to_string())?;
    let transaction = connection
        .transaction()
        .map_err(|error| format!("The local vocabulary transaction could not start: {error}"))?;

    for request in &requests {
        persist_vocabulary_entry(&transaction, request)?;
    }

    transaction
        .commit()
        .map_err(|error| format!("The local vocabulary transaction could not commit: {error}"))?;

    Ok(requests
        .into_iter()
        .map(|request| StoredVocabularyEntry {
            entry: request.entry,
            layer: request.layer,
        })
        .collect())
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveVocabularyUserMetadataRequest {
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VocabularyUserMetadataRecord {
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

type MetadataDatabaseRow = (
    String,
    i64,
    String,
    String,
    String,
    String,
    Option<String>,
    i64,
    String,
    String,
);

fn parse_metadata_record(row: MetadataDatabaseRow) -> Result<VocabularyUserMetadataRecord, String> {
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
    ) = row;
    let tags = serde_json::from_str(&tags_json)
        .map_err(|error| format!("Stored vocabulary tags are invalid: {error}"))?;

    let record = VocabularyUserMetadataRecord {
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
    let value = serde_json::to_value(&record)
        .map_err(|error| format!("Stored vocabulary metadata could not be decoded: {error}"))?;
    validate_vocabulary_user_metadata(&value)
        .map_err(|error| format!("Stored vocabulary metadata is invalid: {error}"))?;
    Ok(record)
}

fn validate_metadata_request(request: &SaveVocabularyUserMetadataRequest) -> Result<(), String> {
    if request.normalized_word.trim().is_empty() {
        return Err("A normalized word is required for vocabulary metadata.".to_string());
    }

    if request.note.chars().count() > 5_000 {
        return Err("The personal note cannot exceed 5,000 characters.".to_string());
    }

    if request.view_count < 0 {
        return Err("Vocabulary view count cannot be negative.".to_string());
    }

    if request.learning_status != "new"
        && request.learning_status != "learning"
        && request.learning_status != "known"
    {
        return Err("Learning status must be 'new', 'learning', or 'known'.".to_string());
    }

    if request.review_status != "imported"
        && request.review_status != "validated"
        && request.review_status != "reviewed"
    {
        return Err("Review status must be 'imported', 'validated', or 'reviewed'.".to_string());
    }

    let tags = request
        .tags
        .as_array()
        .ok_or_else(|| "Vocabulary tags must be an array.".to_string())?;
    if tags.len() > 30 {
        return Err("A vocabulary entry can contain at most 30 tags.".to_string());
    }

    Ok(())
}

fn read_metadata_by_word(
    connection: &rusqlite::Connection,
    normalized_word: &str,
) -> Result<Option<VocabularyUserMetadataRecord>, String> {
    let row = connection
        .query_row(
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
            WHERE normalized_word = ?1
            "#,
            params![normalized_word],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                    row.get(5)?,
                    row.get(6)?,
                    row.get(7)?,
                    row.get(8)?,
                    row.get(9)?,
                ))
            },
        )
        .optional()
        .map_err(|error| format!("Vocabulary metadata could not be read: {error}"))?;

    row.map(parse_metadata_record).transpose()
}

#[tauri::command]
pub fn list_vocabulary_user_metadata(
    state: State<'_, AppState>,
) -> Result<Vec<VocabularyUserMetadataRecord>, String> {
    let connection = state
        .database
        .lock()
        .map_err(|_| "The local vocabulary database lock is unavailable.".to_string())?;
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
            ORDER BY updated_at DESC, normalized_word ASC
            "#,
        )
        .map_err(|error| format!("Vocabulary metadata could not be prepared: {error}"))?;
    let rows = statement
        .query_map([], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
                row.get(5)?,
                row.get(6)?,
                row.get(7)?,
                row.get(8)?,
                row.get(9)?,
            ))
        })
        .map_err(|error| format!("Vocabulary metadata could not be queried: {error}"))?;

    rows.map(|row| {
        let database_row =
            row.map_err(|error| format!("Vocabulary metadata row could not be read: {error}"))?;
        parse_metadata_record(database_row)
    })
    .collect()
}

#[tauri::command]
pub fn get_vocabulary_user_metadata(
    normalized_word: String,
    state: State<'_, AppState>,
) -> Result<Option<VocabularyUserMetadataRecord>, String> {
    let connection = state
        .database
        .lock()
        .map_err(|_| "The local vocabulary database lock is unavailable.".to_string())?;
    read_metadata_by_word(&connection, &normalized_word)
}

#[tauri::command]
pub fn save_vocabulary_user_metadata(
    request: SaveVocabularyUserMetadataRequest,
    state: State<'_, AppState>,
) -> Result<VocabularyUserMetadataRecord, String> {
    validate_metadata_request(&request)?;
    let metadata = serde_json::to_value(&request)
        .map_err(|error| format!("Vocabulary metadata could not be decoded: {error}"))?;
    validate_vocabulary_user_metadata(&metadata)?;
    let tags_json = serde_json::to_string(&request.tags)
        .map_err(|error| format!("Vocabulary tags could not be serialized: {error}"))?;
    let mut connection = state
        .database
        .lock()
        .map_err(|_| "The local vocabulary database lock is unavailable.".to_string())?;
    let transaction = connection
        .transaction()
        .map_err(|error| format!("The metadata transaction could not start: {error}"))?;

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
            ON CONFLICT(normalized_word) DO UPDATE SET
                favorite = excluded.favorite,
                tags_json = excluded.tags_json,
                note = excluded.note,
                learning_status = excluded.learning_status,
                review_status = excluded.review_status,
                last_viewed_at = excluded.last_viewed_at,
                view_count = excluded.view_count,
                updated_at = excluded.updated_at
            "#,
            params![
                request.normalized_word,
                if request.favorite { 1 } else { 0 },
                tags_json,
                request.note,
                request.learning_status,
                request.review_status,
                request.last_viewed_at,
                request.view_count,
                request.created_at,
                request.updated_at,
            ],
        )
        .map_err(|error| format!("Vocabulary metadata could not be saved: {error}"))?;

    transaction
        .commit()
        .map_err(|error| format!("The metadata transaction could not commit: {error}"))?;

    read_metadata_by_word(&connection, &request.normalized_word)?
        .ok_or_else(|| "Saved vocabulary metadata could not be reloaded.".to_string())
}

#[tauri::command]
pub fn record_vocabulary_view(
    normalized_word: String,
    viewed_at: String,
    state: State<'_, AppState>,
) -> Result<VocabularyUserMetadataRecord, String> {
    if normalized_word.trim().is_empty() {
        return Err("A normalized word is required before recording a view.".to_string());
    }

    let connection = state
        .database
        .lock()
        .map_err(|_| "The local vocabulary database lock is unavailable.".to_string())?;
    connection
        .execute(
            r#"
            INSERT INTO vocabulary_user_metadata(
                normalized_word,
                last_viewed_at,
                view_count,
                created_at,
                updated_at
            ) VALUES (?1, ?2, 1, ?2, ?2)
            ON CONFLICT(normalized_word) DO UPDATE SET
                last_viewed_at = excluded.last_viewed_at,
                view_count = vocabulary_user_metadata.view_count + 1,
                updated_at = excluded.updated_at
            "#,
            params![normalized_word, viewed_at],
        )
        .map_err(|error| format!("Vocabulary view history could not be recorded: {error}"))?;

    read_metadata_by_word(&connection, &normalized_word)?
        .ok_or_else(|| "Recorded vocabulary metadata could not be reloaded.".to_string())
}
