use serde::Serialize;
use serde_json::Value;
use tauri::State;

use crate::{
    commands::{database, resilient_records, settings},
    state::AppState,
    validation,
};

fn validate_each<T, F>(values: &[T], validate: F) -> Result<(), String>
where
    F: Fn(&T) -> Result<(), String>,
{
    for value in values {
        validate(value)?;
    }
    Ok(())
}

fn serialized_value<T: Serialize>(value: &T, label: &str) -> Result<Value, String> {
    serde_json::to_value(value).map_err(|error| format!("{label} could not be serialized: {error}"))
}

fn validate_stored_vocabulary_entry<T: Serialize>(value: &T) -> Result<(), String> {
    let value = serialized_value(value, "Stored vocabulary entry")?;
    let object = value
        .as_object()
        .ok_or_else(|| "Stored vocabulary entry must be an object.".to_string())?;
    let entry = object
        .get("entry")
        .ok_or_else(|| "Stored vocabulary entry is missing its entry payload.".to_string())?;
    let layer = object
        .get("layer")
        .and_then(Value::as_str)
        .ok_or_else(|| "Stored vocabulary entry is missing its storage layer.".to_string())?;

    if !matches!(layer, "user" | "override") {
        return Err("Stored vocabulary layer must be user or override.".to_string());
    }

    validation::validate_vocabulary_entry(entry)
}

fn validate_vocabulary_metadata<T: Serialize>(value: &T) -> Result<(), String> {
    let value = serialized_value(value, "Vocabulary metadata")?;
    validation::validate_vocabulary_user_metadata(&value)
}

#[tauri::command]
pub fn list_vocabulary_entries(
    state: State<'_, AppState>,
) -> Result<Vec<database::StoredVocabularyEntry>, String> {
    let records = database::list_vocabulary_entries(state)?;
    validate_each(&records, validate_stored_vocabulary_entry)?;
    Ok(records)
}

#[tauri::command]
pub fn get_vocabulary_entry_by_normalized_word(
    normalized_word: String,
    state: State<'_, AppState>,
) -> Result<Option<database::StoredVocabularyEntry>, String> {
    let record = database::get_vocabulary_entry_by_normalized_word(normalized_word, state)?;
    if let Some(record) = &record {
        validate_stored_vocabulary_entry(record)?;
    }
    Ok(record)
}

#[tauri::command]
pub fn save_vocabulary_entry(
    request: database::SaveVocabularyEntryRequest,
    state: State<'_, AppState>,
) -> Result<database::StoredVocabularyEntry, String> {
    let record = database::save_vocabulary_entry(request, state)?;
    validate_stored_vocabulary_entry(&record)?;
    Ok(record)
}

#[tauri::command]
pub fn save_vocabulary_entries(
    requests: Vec<database::SaveVocabularyEntryRequest>,
    state: State<'_, AppState>,
) -> Result<Vec<database::StoredVocabularyEntry>, String> {
    let records = database::save_vocabulary_entries(requests, state)?;
    validate_each(&records, validate_stored_vocabulary_entry)?;
    Ok(records)
}

#[tauri::command]
pub fn list_resilient_vocabulary_entries(
    state: State<'_, AppState>,
) -> Result<Vec<resilient_records::StoredVocabularyEntry>, String> {
    let records = resilient_records::list_resilient_vocabulary_entries(state)?;
    validate_each(&records, validate_stored_vocabulary_entry)?;
    Ok(records)
}

#[tauri::command]
pub fn list_vocabulary_user_metadata(
    state: State<'_, AppState>,
) -> Result<Vec<database::VocabularyUserMetadataRecord>, String> {
    let records = database::list_vocabulary_user_metadata(state)?;
    validate_each(&records, validate_vocabulary_metadata)?;
    Ok(records)
}

#[tauri::command]
pub fn get_vocabulary_user_metadata(
    normalized_word: String,
    state: State<'_, AppState>,
) -> Result<Option<database::VocabularyUserMetadataRecord>, String> {
    let record = database::get_vocabulary_user_metadata(normalized_word, state)?;
    if let Some(record) = &record {
        validate_vocabulary_metadata(record)?;
    }
    Ok(record)
}

#[tauri::command]
pub fn save_vocabulary_user_metadata(
    request: database::SaveVocabularyUserMetadataRequest,
    state: State<'_, AppState>,
) -> Result<database::VocabularyUserMetadataRecord, String> {
    let record = database::save_vocabulary_user_metadata(request, state)?;
    validate_vocabulary_metadata(&record)?;
    Ok(record)
}

#[tauri::command]
pub fn record_vocabulary_view(
    normalized_word: String,
    viewed_at: String,
    state: State<'_, AppState>,
) -> Result<database::VocabularyUserMetadataRecord, String> {
    let record = database::record_vocabulary_view(normalized_word, viewed_at, state)?;
    validate_vocabulary_metadata(&record)?;
    Ok(record)
}

#[tauri::command]
pub fn get_app_settings(state: State<'_, AppState>) -> Result<Option<Value>, String> {
    let settings = settings::get_app_settings(state)?;
    if let Some(settings) = &settings {
        validation::validate_app_settings(settings)?;
    }
    Ok(settings)
}

#[tauri::command]
pub fn save_app_settings(settings: Value, state: State<'_, AppState>) -> Result<Value, String> {
    let settings = settings::save_app_settings(settings, state)?;
    validation::validate_app_settings(&settings)?;
    Ok(settings)
}

#[cfg(test)]
mod tests {
    use serde::Serialize;
    use serde_json::Value;

    use super::validate_stored_vocabulary_entry;

    #[derive(Serialize)]
    struct StoredVocabularyFixture<'a> {
        entry: &'a Value,
        layer: &'a str,
    }

    fn bundled_maintain_entry() -> Value {
        serde_json::from_str(include_str!(
            "../../../src/content/core/entries/maintain.entry.json"
        ))
        .expect("maintain fixture must be valid JSON")
    }

    #[test]
    fn accepts_a_current_stored_vocabulary_response() {
        let entry = bundled_maintain_entry();
        let fixture = StoredVocabularyFixture {
            entry: &entry,
            layer: "override",
        };

        validate_stored_vocabulary_entry(&fixture)
            .expect("current stored vocabulary responses must satisfy the bridge contract");
    }

    #[test]
    fn rejects_an_unknown_storage_layer_at_the_bridge() {
        let entry = bundled_maintain_entry();
        let fixture = StoredVocabularyFixture {
            entry: &entry,
            layer: "core",
        };

        let error = validate_stored_vocabulary_entry(&fixture)
            .expect_err("replaceable core data must not cross the persistence bridge");

        assert!(error.contains("storage layer"));
    }
}
