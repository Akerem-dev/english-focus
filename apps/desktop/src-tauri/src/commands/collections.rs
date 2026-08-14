use rusqlite::{params, OptionalExtension};
use serde_json::Value;
use tauri::State;

use crate::state::AppState;

const COLLECTIONS_STATE_VERSION: u64 = 1;
const MAX_COLLECTIONS: usize = 500;
const MAX_STATE_BYTES: usize = 32 * 1024 * 1024;

fn validate_collections_state(value: &Value) -> Result<(), String> {
    let object = value
        .as_object()
        .ok_or_else(|| "Collections state must be an object.".to_string())?;

    if object.get("version").and_then(Value::as_u64) != Some(COLLECTIONS_STATE_VERSION) {
        return Err("Collections state version is not supported by this application build.".to_string());
    }

    let collections = object
        .get("collections")
        .and_then(Value::as_array)
        .ok_or_else(|| "Collections state must contain a collections array.".to_string())?;

    if collections.len() > MAX_COLLECTIONS {
        return Err(format!("At most {MAX_COLLECTIONS} collections can be stored."));
    }

    for collection in collections {
        let record = collection
            .as_object()
            .ok_or_else(|| "A stored collection is invalid.".to_string())?;

        for field in ["id", "title", "description", "tone", "coverPreset"] {
            if !record.get(field).is_some_and(Value::is_string) {
                return Err(format!("Stored collection field '{field}' is required."));
            }
        }

        let word_ids = record
            .get("wordIds")
            .and_then(Value::as_array)
            .ok_or_else(|| "Stored collection wordIds must be an array.".to_string())?;
        if word_ids.iter().any(|word_id| !word_id.is_string()) {
            return Err("Stored collection wordIds must contain only strings.".to_string());
        }

        if record
            .get("coverImage")
            .is_some_and(|cover_image| !cover_image.is_string() && !cover_image.is_null())
        {
            return Err("Stored collection coverImage must be a string when present.".to_string());
        }
    }

    Ok(())
}

#[tauri::command]
pub fn get_collections_state(state: State<'_, AppState>) -> Result<Option<Value>, String> {
    let connection = state
        .database
        .lock()
        .map_err(|_| "The local collections database lock is unavailable.".to_string())?;

    let stored = connection
        .query_row(
            "SELECT state_json FROM collections_state WHERE id = 1",
            [],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|error| format!("Saved collections could not be read: {error}"))?;

    stored
        .map(|json| {
            let value: Value = serde_json::from_str(&json)
                .map_err(|error| format!("Saved collections JSON is invalid: {error}"))?;
            validate_collections_state(&value)?;
            Ok(value)
        })
        .transpose()
}

#[tauri::command]
pub fn save_collections_state(
    collections_state: Value,
    state: State<'_, AppState>,
) -> Result<Value, String> {
    validate_collections_state(&collections_state)?;
    let json = serde_json::to_string(&collections_state)
        .map_err(|error| format!("Collections could not be serialized: {error}"))?;

    if json.len() > MAX_STATE_BYTES {
        return Err("Collections data is too large to save safely.".to_string());
    }

    let connection = state
        .database
        .lock()
        .map_err(|_| "The local collections database lock is unavailable.".to_string())?;
    connection
        .execute(
            r#"
            INSERT INTO collections_state(id, state_json, updated_at)
            VALUES (1, ?1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
            ON CONFLICT(id) DO UPDATE SET
                state_json = excluded.state_json,
                updated_at = excluded.updated_at
            "#,
            params![json],
        )
        .map_err(|error| format!("Collections could not be saved: {error}"))?;

    Ok(collections_state)
}
