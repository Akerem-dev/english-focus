use std::collections::HashSet;
use std::time::Duration;

use chrono::{SecondsFormat, Utc};
use keyring::{Entry, Error as KeyringError};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};

use super::assistant_generation;
use crate::validation::validate_vocabulary_entry;

const PRIMARY_MODEL: &str = "gemini-3.5-flash-lite";
const PRIMARY_MODEL_LABEL: &str = "Gemini 3.5 Flash-Lite";
const GEMINI_INTERACTIONS_URL: &str =
    "https://generativelanguage.googleapis.com/v1beta/interactions";
const KEYRING_SERVICE: &str = "English Focus";
const KEYRING_USERNAME: &str = "gemini-api-key";
const VOCABULARY_ENTRY_SCHEMA: &str = include_str!("../../schemas/vocabulary-entry.schema.json");

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssistantRoutingPreferences {
    detail_level: String,
    target_proficiency: String,
    include_grammar_notes: bool,
    include_etymology: bool,
    include_usage_tips: bool,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssistantRoutingCandidateResponse {
    value: Value,
    model: String,
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

    if normalized.is_empty()
        || normalized.len() > 80
        || !normalized
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
                "format",
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

fn remove_required_field(object_schema: &mut Value, field_name: &str) {
    if let Some(properties) = object_schema
        .get_mut("properties")
        .and_then(Value::as_object_mut)
    {
        properties.remove(field_name);
    }

    if let Some(required) = object_schema
        .get_mut("required")
        .and_then(Value::as_array_mut)
    {
        required.retain(|field| field.as_str() != Some(field_name));
    }
}

fn set_array_limits(schema: &mut Value, pointer: &str, minimum: Option<u64>, maximum: u64) {
    let Some(array_schema) = schema.pointer_mut(pointer).and_then(Value::as_object_mut) else {
        return;
    };

    if let Some(minimum) = minimum {
        array_schema.insert("minItems".to_string(), json!(minimum));
    }
    array_schema.insert("maxItems".to_string(), json!(maximum));
}

fn response_schema() -> Result<Value, String> {
    let bundled: Value = serde_json::from_str(VOCABULARY_ENTRY_SCHEMA)
        .map_err(|error| format!("The bundled vocabulary schema is invalid: {error}"))?;
    let source = bundled
        .pointer("/anyOf/0/properties")
        .and_then(Value::as_object)
        .ok_or_else(|| "The bundled vocabulary schema has no entry properties.".to_string())?;
    let mut properties = Map::new();

    for field in [
        "aliases",
        "pronunciations",
        "cefr",
        "registers",
        "partsOfSpeech",
        "meanings",
        "morphology",
        "etymology",
        "grammar",
        "examples",
    ] {
        properties.insert(
            field.to_string(),
            source
                .get(field)
                .ok_or_else(|| format!("The bundled vocabulary schema is missing {field}."))?
                .clone(),
        );
    }

    let mut schema = json!({
        "type": "object",
        "properties": properties,
        "required": [
            "aliases",
            "pronunciations",
            "cefr",
            "registers",
            "partsOfSpeech",
            "meanings",
            "morphology",
            "grammar",
            "examples"
        ],
        "additionalProperties": false
    });
    sanitize_schema(&mut schema);

    if let Some(meaning) = schema.pointer_mut("/properties/meanings/items") {
        remove_required_field(meaning, "id");
    }
    if let Some(example) = schema.pointer_mut("/properties/examples/items") {
        remove_required_field(example, "id");
    }

    for (pointer, minimum, maximum) in [
        ("/properties/aliases", None, 12),
        ("/properties/pronunciations", Some(1), 3),
        ("/properties/registers", None, 6),
        ("/properties/partsOfSpeech", Some(1), 4),
        ("/properties/meanings", Some(1), 3),
        (
            "/properties/meanings/items/properties/translationsTr",
            Some(1),
            4,
        ),
        (
            "/properties/meanings/items/properties/registers",
            None,
            4,
        ),
        (
            "/properties/morphology/properties/inflectedForms",
            None,
            8,
        ),
        ("/properties/examples", Some(3), 3),
        (
            "/properties/examples/items/properties/registers",
            None,
            4,
        ),
    ] {
        set_array_limits(&mut schema, pointer, minimum, maximum);
    }

    Ok(schema)
}

fn preparation_prompt(
    normalized_word: &str,
    preferences: &AssistantRoutingPreferences,
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
        "Provide short bilingual grammar and usage summaries."
    } else {
        "Keep the required grammar summaries minimal and factual."
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
        "Create one dictionary-quality English vocabulary record for a Turkish learner.\n\nRequested headword: \"{normalized_word}\"\nTarget learner level: {target}\n\nHard requirements:\n- Return only one JSON object matching the supplied schema.\n- morphology.baseForm must be exactly \"{normalized_word}\".\n- Provide one to three distinct meanings with natural Turkish translations.\n- Provide at least one accurate IPA pronunciation.\n- Provide exactly three distinct natural English examples, each containing the base word or a declared inflected form, and translate every example into Turkish.\n- Do not repeat the base word inside aliases.\n- Use lowercase normalized inflected forms.\n- Do not invent uncertain facts or unsupported word senses.\n- {detail}\n- {grammar}\n- {etymology}\n- {usage}\n- Do not include identifiers, source metadata, timestamps, markdown, commentary, or text outside the JSON object."
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
        let normalized = alias
            .trim()
            .replace('’', "'")
            .split_whitespace()
            .collect::<Vec<_>>()
            .join(" ")
            .to_ascii_lowercase();
        normalized != normalized_word && seen.insert(normalized)
    });
}

fn assign_stable_ids(value: &mut Value, slug: &str) {
    for (collection, segment) in [("meanings", "meaning"), ("examples", "example")] {
        if let Some(items) = value.get_mut(collection).and_then(Value::as_array_mut) {
            for (index, item) in items.iter_mut().enumerate() {
                if let Some(fields) = item.as_object_mut() {
                    fields.insert(
                        "id".to_string(),
                        json!(format!("{slug}.{segment}.{:02}", index + 1)),
                    );
                }
            }
        }
    }
}

fn finalize_candidate(mut value: Value, normalized_word: &str) -> Result<Value, String> {
    remove_null_fields(&mut value);
    let slug = entry_slug(normalized_word);
    normalize_aliases(&mut value, normalized_word);
    assign_stable_ids(&mut value, &slug);

    let timestamp = Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true);
    let fields = value
        .as_object_mut()
        .ok_or_else(|| "assistant_generation_invalid: Gemini returned no vocabulary object.".to_string())?;
    let morphology = fields
        .get_mut("morphology")
        .and_then(Value::as_object_mut)
        .ok_or_else(|| "assistant_generation_invalid: Gemini returned incomplete morphology.".to_string())?;
    morphology.insert("baseForm".to_string(), json!(normalized_word));

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
            "generatedAt": timestamp.clone(),
            "validationStatus": "unvalidated",
            "generatorLabel": PRIMARY_MODEL_LABEL,
            "warnings": []
        }),
    );
    fields.insert("createdAt".to_string(), json!(timestamp.clone()));
    fields.insert("updatedAt".to_string(), json!(timestamp));

    validate_vocabulary_entry(&value)
        .map_err(|error| format!("assistant_generation_invalid: {error}"))?;
    Ok(value)
}

fn extract_output_text(response: &GeminiInteractionResponse) -> Result<&str, String> {
    if response.status != "completed" {
        return Err(format!(
            "assistant_generation_invalid: Gemini did not complete the request (status: {}).",
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
        .ok_or_else(|| "assistant_generation_invalid: Gemini returned no vocabulary content.".to_string())
}

async fn api_error(status: StatusCode, response: reqwest::Response) -> String {
    let (code, fallback) = match status {
        StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN => (
            "assistant_api_key_rejected",
            "The Gemini API key was rejected. Replace it in Settings.",
        ),
        StatusCode::TOO_MANY_REQUESTS => (
            "assistant_quota_exhausted",
            "The fast-model quota was reached.",
        ),
        StatusCode::BAD_REQUEST | StatusCode::NOT_FOUND => (
            "assistant_request_rejected",
            "The fast model could not accept this request.",
        ),
        _ => (
            "assistant_provider_error",
            "The fast model could not prepare this word.",
        ),
    };
    let body = response.text().await.unwrap_or_default();
    let detail = serde_json::from_str::<Value>(&body).ok().and_then(|value| {
        value
            .pointer("/error/message")
            .and_then(Value::as_str)
            .map(str::to_string)
    });

    detail.map_or_else(
        || format!("{code}: {fallback}"),
        |message| format!("{code}: {fallback} {message}"),
    )
}

async fn generate_primary(
    word: &str,
    preferences: &AssistantRoutingPreferences,
) -> Result<AssistantRoutingCandidateResponse, String> {
    let api_key = read_api_key()?.ok_or_else(|| {
        "assistant_api_key_missing: Connect the word helper in Settings.".to_string()
    })?;
    let normalized_word = normalize_headword(word)?;
    let prompt = preparation_prompt(&normalized_word, preferences)?;
    let request = json!({
        "model": PRIMARY_MODEL,
        "input": prompt,
        "store": false,
        "generation_config": {
            "thinking_level": "minimal",
            "max_output_tokens": 4096
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
        .map_err(|error| format!("assistant_network_error: Gemini could not be reached: {error}"))?;
    let status = response.status();

    if !status.is_success() {
        return Err(api_error(status, response).await);
    }

    let response = response
        .json::<GeminiInteractionResponse>()
        .await
        .map_err(|error| format!("assistant_generation_invalid: Gemini returned an unreadable response: {error}"))?;
    let output = extract_output_text(&response)?;
    let candidate: Value = serde_json::from_str(output)
        .map_err(|error| format!("assistant_generation_invalid: Gemini returned invalid JSON: {error}"))?;

    Ok(AssistantRoutingCandidateResponse {
        value: finalize_candidate(candidate, &normalized_word)?,
        model: PRIMARY_MODEL.to_string(),
        usage: response.usage,
    })
}

fn should_try_quality(error: &str) -> bool {
    [
        "assistant_quota_exhausted",
        "assistant_request_rejected",
        "assistant_provider_error",
        "assistant_generation_invalid",
    ]
    .iter()
    .any(|code| error.contains(code))
}

async fn generate_quality(
    word: String,
    preferences: AssistantRoutingPreferences,
) -> Result<AssistantRoutingCandidateResponse, String> {
    let preferences = serde_json::from_value(serde_json::to_value(preferences).map_err(|error| {
        format!("The word helper preferences could not be prepared: {error}")
    })?)
    .map_err(|error| format!("The word helper preferences are invalid: {error}"))?;
    let response = assistant_generation::generate_vocabulary_candidate(word, preferences).await?;
    serde_json::from_value(serde_json::to_value(response).map_err(|error| {
        format!("The quality-model response could not be prepared: {error}")
    })?)
    .map_err(|error| format!("The quality-model response is invalid: {error}"))
}

pub async fn generate_vocabulary_candidate(
    word: String,
    preferences: AssistantRoutingPreferences,
) -> Result<AssistantRoutingCandidateResponse, String> {
    match generate_primary(&word, &preferences).await {
        Ok(candidate) => Ok(candidate),
        Err(error) if should_try_quality(&error) => generate_quality(word, preferences).await,
        Err(error) => Err(error),
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::{normalize_headword, response_schema, should_try_quality};

    #[test]
    fn normalizes_supported_headwords() {
        assert_eq!(normalize_headword("  Look   up ").unwrap(), "look up");
        assert_eq!(normalize_headword("Mother’s").unwrap(), "mother's");
        assert!(normalize_headword("word!").is_err());
    }

    #[test]
    fn generation_schema_uses_three_examples_without_generated_ids() {
        let schema = response_schema().unwrap();

        assert_eq!(schema["properties"]["examples"]["minItems"], json!(3));
        assert_eq!(schema["properties"]["examples"]["maxItems"], json!(3));
        assert!(schema["properties"]["meanings"]["items"]["properties"]
            .get("id")
            .is_none());
        assert!(schema["properties"]["examples"]["items"]["properties"]
            .get("id")
            .is_none());
    }

    #[test]
    fn quality_retry_ignores_key_and_network_failures() {
        assert!(should_try_quality("assistant_quota_exhausted"));
        assert!(should_try_quality("assistant_generation_invalid"));
        assert!(!should_try_quality("assistant_api_key_rejected"));
        assert!(!should_try_quality("assistant_network_error"));
    }
}
