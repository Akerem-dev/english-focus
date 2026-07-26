use std::collections::HashSet;
use std::time::Duration;

use chrono::{SecondsFormat, Utc};
use keyring::{Entry, Error as KeyringError};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::validation::validate_vocabulary_entry;

const ASSISTANT_MODEL: &str = "gemini-3.6-flash";
const GEMINI_INTERACTIONS_URL: &str = "https://generativelanguage.googleapis.com/v1/interactions";
const KEYRING_SERVICE: &str = "English Focus";
const KEYRING_USERNAME: &str = "gemini-api-key";
const VOCABULARY_ENTRY_SCHEMA: &str = include_str!("../../schemas/vocabulary-entry.schema.json");

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssistantPreferences {
    detail_level: String,
    target_proficiency: String,
    include_grammar_notes: bool,
    include_etymology: bool,
    include_usage_tips: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssistantStatus {
    configured: bool,
    model: &'static str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssistantCandidateResponse {
    value: Value,
    model: &'static str,
    usage: Option<Value>,
}

#[derive(Deserialize)]
struct GeminiInteractionResponse {
    status: String,
    #[serde(default)]
    steps: Vec<GeminiInteractionStep>,
    usage: Option<Value>,
}

#[derive(Deserialize)]
struct GeminiInteractionStep {
    #[serde(rename = "type")]
    kind: String,
    #[serde(default)]
    content: Vec<GeminiInteractionContent>,
}

#[derive(Deserialize)]
struct GeminiInteractionContent {
    #[serde(rename = "type")]
    kind: String,
    text: Option<String>,
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

fn normalize_headword(word: &str) -> Result<String, String> {
    let normalized = word
        .trim()
        .replace('’', "'")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .to_ascii_lowercase();

    if normalized.is_empty() || normalized.len() > 80 {
        return Err("Enter one English word or a short phrasal verb.".to_string());
    }

    if !normalized
        .chars()
        .all(|character| character.is_ascii_alphabetic() || matches!(character, ' ' | '-' | '\''))
    {
        return Err("Enter one English word or a short phrasal verb.".to_string());
    }

    Ok(normalized)
}

fn entry_slug(normalized_word: &str) -> String {
    let mut slug = String::new();
    let mut separator_pending = false;

    for character in normalized_word.chars() {
        if character.is_ascii_alphanumeric() {
            if separator_pending && !slug.is_empty() {
                slug.push('-');
            }
            separator_pending = false;
            slug.push(character);
        } else {
            separator_pending = true;
        }
    }

    slug.trim_matches('-').to_string()
}

fn sanitize_schema(value: &mut Value) {
    match value {
        Value::Array(items) => {
            for item in items {
                sanitize_schema(item);
            }
        }
        Value::Object(fields) => {
            if let Some(constant) = fields.remove("const") {
                fields.insert("enum".to_string(), Value::Array(vec![constant]));
            }

            for unsupported in [
                "$schema",
                "default",
                "examples",
                "minLength",
                "maxLength",
                "pattern",
                "uniqueItems",
            ] {
                fields.remove(unsupported);
            }

            for child in fields.values_mut() {
                sanitize_schema(child);
            }
        }
        _ => {}
    }
}

fn response_schema() -> Result<Value, String> {
    let mut schema: Value = serde_json::from_str(VOCABULARY_ENTRY_SCHEMA)
        .map_err(|error| format!("The bundled vocabulary schema is invalid: {error}"))?;
    sanitize_schema(&mut schema);
    Ok(schema)
}

fn preparation_prompt(
    normalized_word: &str,
    preferences: &AssistantPreferences,
) -> Result<String, String> {
    let detail = match preferences.detail_level.as_str() {
        "balanced" => "Keep definitions and notes concise.",
        "detailed" => "Use balanced detail suitable for regular study.",
        "maximum" => "Use detailed but practical explanations without filler.",
        _ => return Err("The selected explanation detail is not supported.".to_string()),
    };
    let target = match preferences.target_proficiency.as_str() {
        "A1" | "A2" | "B1" | "B2" | "C1" | "C2" => preferences.target_proficiency.as_str(),
        _ => return Err("The selected proficiency level is not supported.".to_string()),
    };
    let grammar = if preferences.include_grammar_notes {
        "Provide a short bilingual grammar or usage summary."
    } else {
        "Keep the required grammar summary minimal and factual."
    };
    let etymology = if preferences.include_etymology {
        "Include etymology only when the origin can be stated reliably; otherwise omit it."
    } else {
        "Omit the optional etymology field."
    };
    let usage = if preferences.include_usage_tips {
        "Add paired English and Turkish usage notes only when they clarify real usage."
    } else {
        "Omit optional usage notes unless essential to prevent a misleading meaning."
    };

    Ok(format!(
        "Create one dictionary-quality English vocabulary record for a Turkish learner.\n\nRequested headword: \"{normalized_word}\"\nTarget learner level: {target}\n\nHard requirements:\n- Return only one JSON object matching the supplied schema.\n- The word, normalizedWord, and morphology.baseForm must represent exactly \"{normalized_word}\".\n- Use schemaVersion 1.0.0.\n- Use source.kind user, sourceId english-focus-assistant, and sourceLabel English Focus word helper.\n- Use generation.method external-ai and generation.validationStatus unvalidated.\n- Provide one to three distinct meanings with natural Turkish translations.\n- Provide at least one IPA pronunciation.\n- Provide exactly three distinct natural English examples, each containing the base word or a declared inflected form, and translate every example into Turkish.\n- Do not repeat the base word inside aliases.\n- Keep all identifiers lowercase and stable-looking.\n- Do not invent uncertain facts or unsupported word senses.\n- {detail}\n- {grammar}\n- {etymology}\n- {usage}\n- Do not include markdown, commentary, or text outside the JSON object."
    ))
}

fn remove_null_fields(value: &mut Value) {
    match value {
        Value::Array(items) => {
            for item in items {
                remove_null_fields(item);
            }
        }
        Value::Object(fields) => {
            fields.retain(|_, field| !field.is_null());
            for field in fields.values_mut() {
                remove_null_fields(field);
            }
        }
        _ => {}
    }
}

fn normalize_aliases(value: &mut Value, normalized_word: &str) {
    let Some(aliases) = value.get_mut("aliases").and_then(Value::as_array_mut) else {
        return;
    };

    let mut seen = HashSet::new();
    aliases.retain(|alias| {
        let Some(alias) = alias.as_str() else {
            return false;
        };
        let normalized_alias = alias
            .trim()
            .replace('’', "'")
            .split_whitespace()
            .collect::<Vec<_>>()
            .join(" ")
            .to_ascii_lowercase();

        normalized_alias != normalized_word && seen.insert(normalized_alias)
    });
}

fn assign_stable_ids(value: &mut Value, slug: &str) {
    if let Some(meanings) = value.get_mut("meanings").and_then(Value::as_array_mut) {
        for (index, meaning) in meanings.iter_mut().enumerate() {
            if let Some(fields) = meaning.as_object_mut() {
                fields.insert(
                    "id".to_string(),
                    Value::String(format!("{slug}.meaning.{:02}", index + 1)),
                );
            }
        }
    }

    if let Some(examples) = value.get_mut("examples").and_then(Value::as_array_mut) {
        examples.truncate(3);
        for (index, example) in examples.iter_mut().enumerate() {
            if let Some(fields) = example.as_object_mut() {
                fields.insert(
                    "id".to_string(),
                    Value::String(format!("{slug}.example.{:02}", index + 1)),
                );
            }
        }
    }
}

fn finalize_candidate(mut value: Value, normalized_word: &str) -> Result<Value, String> {
    remove_null_fields(&mut value);
    let slug = entry_slug(normalized_word);
    if slug.is_empty() {
        return Err("The requested word could not be normalized.".to_string());
    }

    normalize_aliases(&mut value, normalized_word);
    assign_stable_ids(&mut value, &slug);

    let timestamp = Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true);
    let fields = value
        .as_object_mut()
        .ok_or_else(|| "Gemini did not return a vocabulary object.".to_string())?;

    fields.insert("schemaVersion".to_string(), json!("1.0.0"));
    fields.insert("id".to_string(), json!(format!("user.{slug}.v1")));
    fields.insert("word".to_string(), json!(normalized_word));
    fields.insert("normalizedWord".to_string(), json!(normalized_word));
    fields.insert(
        "source".to_string(),
        json!({
            "kind": "user",
            "sourceId": "english-focus-assistant",
            "sourceLabel": "English Focus word helper"
        }),
    );
    fields.insert(
        "generation".to_string(),
        json!({
            "method": "external-ai",
            "generatedAt": timestamp,
            "validationStatus": "unvalidated",
            "generatorLabel": "Gemini 3.6 Flash",
            "warnings": []
        }),
    );
    fields.insert("createdAt".to_string(), json!(timestamp));
    fields.insert("updatedAt".to_string(), json!(timestamp));

    validate_vocabulary_entry(&value)
        .map_err(|error| format!("assistant_generation_invalid: {error}"))?;
    Ok(value)
}

fn extract_output_text(response: &GeminiInteractionResponse) -> Result<&str, String> {
    if response.status != "completed" {
        return Err(format!(
            "Gemini did not complete the vocabulary request (status: {}).",
            response.status
        ));
    }

    response
        .steps
        .iter()
        .rev()
        .find(|step| step.kind == "model_output")
        .and_then(|step| {
            step.content
                .iter()
                .rev()
                .find(|content| content.kind == "text")
        })
        .and_then(|content| content.text.as_deref())
        .ok_or_else(|| "Gemini returned no vocabulary content.".to_string())
}

async fn api_error_message(status: StatusCode, response: reqwest::Response) -> String {
    let fallback = match status {
        StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN => {
            "The Gemini API key was rejected. Replace it in Settings."
        }
        StatusCode::TOO_MANY_REQUESTS => {
            "The Gemini usage limit was reached. Wait for the quota to reset and try again."
        }
        StatusCode::BAD_REQUEST => "Gemini could not accept this vocabulary request.",
        _ => "Gemini could not prepare this word right now.",
    };

    let body = response.text().await.unwrap_or_default();
    let detail = serde_json::from_str::<Value>(&body).ok().and_then(|value| {
        value
            .pointer("/error/message")
            .and_then(Value::as_str)
            .map(str::to_string)
    });

    detail.map_or_else(
        || fallback.to_string(),
        |message| format!("{fallback} {message}"),
    )
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

#[tauri::command]
pub async fn assistant_generate_vocabulary(
    word: String,
    preferences: AssistantPreferences,
) -> Result<AssistantCandidateResponse, String> {
    let api_key = read_api_key()?.ok_or_else(|| {
        "assistant_api_key_missing: Connect the word helper in Settings.".to_string()
    })?;
    let normalized_word = normalize_headword(&word)?;
    let prompt = preparation_prompt(&normalized_word, &preferences)?;
    let request = json!({
        "model": ASSISTANT_MODEL,
        "input": prompt,
        "store": false,
        "generation_config": {
            "thinking_level": "low",
            "max_output_tokens": 8192
        },
        "response_format": {
            "type": "text",
            "mime_type": "application/json",
            "schema": response_schema()?
        }
    });

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(45))
        .build()
        .map_err(|error| format!("The secure Gemini client could not start: {error}"))?;
    let response = client
        .post(GEMINI_INTERACTIONS_URL)
        .header("x-goog-api-key", api_key)
        .json(&request)
        .send()
        .await
        .map_err(|error| format!("Gemini could not be reached: {error}"))?;
    let status = response.status();

    if !status.is_success() {
        return Err(api_error_message(status, response).await);
    }

    let response = response
        .json::<GeminiInteractionResponse>()
        .await
        .map_err(|error| format!("Gemini returned an unreadable response: {error}"))?;
    let output = extract_output_text(&response)?;
    let candidate: Value = serde_json::from_str(output)
        .map_err(|error| format!("Gemini returned invalid JSON: {error}"))?;
    let value = finalize_candidate(candidate, &normalized_word)?;

    Ok(AssistantCandidateResponse {
        value,
        model: ASSISTANT_MODEL,
        usage: response.usage,
    })
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::{entry_slug, normalize_aliases, normalize_headword, sanitize_schema};

    #[test]
    fn normalizes_supported_headwords() {
        assert_eq!(normalize_headword("  Look   up ").unwrap(), "look up");
        assert_eq!(normalize_headword("Mother’s").unwrap(), "mother's");
        assert!(normalize_headword("word!").is_err());
    }

    #[test]
    fn creates_stable_entry_slugs() {
        assert_eq!(entry_slug("look up"), "look-up");
        assert_eq!(entry_slug("mother's"), "mother-s");
    }

    #[test]
    fn removes_unsupported_schema_keywords_and_preserves_constants_as_enums() {
        let mut schema = json!({
            "$schema": "draft",
            "const": "1.0.0",
            "pattern": "x",
            "properties": { "word": { "type": "string", "minLength": 1 } }
        });

        sanitize_schema(&mut schema);

        assert_eq!(schema["enum"], json!(["1.0.0"]));
        assert!(schema.get("$schema").is_none());
        assert!(schema.get("pattern").is_none());
        assert!(schema["properties"]["word"].get("minLength").is_none());
    }

    #[test]
    fn removes_duplicate_and_base_word_aliases() {
        let mut value = json!({ "aliases": ["maintain", "Maintained", "maintained"] });
        normalize_aliases(&mut value, "maintain");
        assert_eq!(value["aliases"], json!(["Maintained"]));
    }
}
