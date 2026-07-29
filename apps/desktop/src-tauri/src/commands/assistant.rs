use keyring::{Entry, Error as KeyringError};
use serde::Serialize;

use super::{
    assistant_dictionary::validate_headword,
    assistant_generation,
    assistant_routing::{
        generate_vocabulary_candidate, AssistantRoutingCandidateResponse,
        AssistantRoutingPreferences,
    },
};

const ASSISTANT_MODEL: &str = "Automatic · Gemini 3.5 Flash-Lite → 3.6 Flash";
const KEYRING_SERVICE: &str = "English Focus";
const KEYRING_USERNAME: &str = "gemini-api-key";

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssistantStatus {
    configured: bool,
    model: &'static str,
}

fn keyring_entry() -> Result<Entry, String> {
    Entry::new(KEYRING_SERVICE, KEYRING_USERNAME)
        .map_err(|error| format!("The operating system credential vault is unavailable: {error}"))
}

fn read_api_key() -> Result<Option<String>, String> {
    match keyring_entry()?.get_password() {
        Ok(api_key) if api_key.trim().is_empty() => Ok(None),
        Ok(api_key) => Ok(Some(api_key)),
        Err(KeyringError::NoEntry) => Ok(None),
        Err(error) => Err(format!(
            "The saved word helper connection could not be read: {error}"
        )),
    }
}

#[tauri::command]
pub fn assistant_get_status() -> Result<AssistantStatus, String> {
    Ok(AssistantStatus {
        configured: read_api_key()?.is_some(),
        model: ASSISTANT_MODEL,
    })
}

#[tauri::command]
pub fn assistant_save_api_key(api_key: String) -> Result<AssistantStatus, String> {
    let api_key = api_key.trim();
    if api_key.len() < 12 || api_key.chars().any(char::is_whitespace) {
        return Err("Enter a valid Gemini API key without spaces.".to_string());
    }

    keyring_entry()?
        .set_password(api_key)
        .map_err(|error| format!("The API key could not be stored securely: {error}"))?;

    Ok(AssistantStatus {
        configured: true,
        model: ASSISTANT_MODEL,
    })
}

#[tauri::command]
pub fn assistant_clear_api_key() -> Result<AssistantStatus, String> {
    match keyring_entry()?.delete_credential() {
        Ok(()) | Err(KeyringError::NoEntry) => Ok(AssistantStatus {
            configured: false,
            model: ASSISTANT_MODEL,
        }),
        Err(error) => Err(format!(
            "The saved API key could not be removed securely: {error}"
        )),
    }
}

async fn generate_quality_candidate(
    word: String,
    preferences: AssistantRoutingPreferences,
) -> Result<AssistantRoutingCandidateResponse, String> {
    let quality_preferences =
        serde_json::from_value(serde_json::to_value(preferences).map_err(|error| {
            format!("The word helper preferences could not be prepared: {error}")
        })?)
        .map_err(|error| format!("The word helper preferences are invalid: {error}"))?;
    let response =
        assistant_generation::generate_vocabulary_candidate(word, quality_preferences).await?;

    serde_json::from_value(
        serde_json::to_value(response).map_err(|error| {
            format!("The quality-model response could not be prepared: {error}")
        })?,
    )
    .map_err(|error| format!("The quality-model response is invalid: {error}"))
}

#[tauri::command]
pub async fn assistant_generate_vocabulary(
    word: String,
    preferences: AssistantRoutingPreferences,
    quality_only: Option<bool>,
) -> Result<AssistantRoutingCandidateResponse, String> {
    // No Gemini request is allowed until two non-AI lexical sources accept the headword.
    // Repeated words are served from the in-memory validation cache.
    validate_headword(&word).await?;

    if quality_only.unwrap_or(false) {
        return generate_quality_candidate(word, preferences).await;
    }

    generate_vocabulary_candidate(word, preferences).await
}
