use rusqlite::{params, OptionalExtension};
use serde_json::Value;
use tauri::State;

use crate::state::AppState;
use crate::validation::validate_app_settings;

#[tauri::command]
pub fn get_app_settings(state: State<'_, AppState>) -> Result<Option<Value>, String> {
    let connection = state
        .database
        .lock()
        .map_err(|_| "The local settings database lock is unavailable.".to_string())?;
    let settings_json = connection
        .query_row(
            "SELECT settings_json FROM app_settings WHERE id = 1",
            [],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|error| format!("Application settings could not be read: {error}"))?;

    settings_json
        .map(|json| {
            let settings = serde_json::from_str(&json)
                .map_err(|error| format!("Stored application settings are invalid: {error}"))?;
            validate_app_settings(&settings)
                .map_err(|error| format!("Stored application settings are invalid: {error}"))?;
            Ok(settings)
        })
        .transpose()
}

#[tauri::command]
pub fn save_app_settings(settings: Value, state: State<'_, AppState>) -> Result<Value, String> {
    validate_app_settings(&settings)?;

    let updated_at = settings
        .get("updatedAt")
        .and_then(Value::as_str)
        .ok_or_else(|| "Application settings require an updatedAt timestamp.".to_string())?;
    let settings_json = serde_json::to_string(&settings)
        .map_err(|error| format!("Application settings could not be serialized: {error}"))?;
    let connection = state
        .database
        .lock()
        .map_err(|_| "The local settings database lock is unavailable.".to_string())?;

    connection
        .execute(
            r#"
            INSERT INTO app_settings(id, settings_json, updated_at)
            VALUES (1, ?1, ?2)
            ON CONFLICT(id) DO UPDATE SET
                settings_json = excluded.settings_json,
                updated_at = excluded.updated_at
            "#,
            params![settings_json, updated_at],
        )
        .map_err(|error| format!("Application settings could not be saved: {error}"))?;

    Ok(settings)
}
