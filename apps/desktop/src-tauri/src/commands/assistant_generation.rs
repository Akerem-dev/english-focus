use std::collections::HashSet;
use std::time::Duration;

use chrono::{SecondsFormat, Utc};
use keyring::{Entry, Error as KeyringError};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::validation::validate_vocabulary_entry;

const ASSISTANT_MODEL: &str = "gemini-3.6-flash";
const GEMINI_INTERACTIONS_URL: &str =
    "https://generativelanguage.googleapis.com/v1beta/interactions";
const KEYRING_SERVICE: &str = "English Focus";
const KEYRING_USERNAME: &str = "gemini-api-key";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssistantGenerationPreferences {
    detail_level: String,
    target_proficiency: String,
    include_grammar_notes: bool,
    include_etymology: bool,
    include_usage_tips: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssistantGenerationCandidateResponse {
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

fn response_schema() -> Value {
    let part_of_speech = json!([
        "noun",
        "verb",
        "adjective",
        "adverb",
        "pronoun",
        "preposition",
        "conjunction",
        "determiner",
        "interjection",
        "modal",
        "auxiliary",
        "phrase",
        "phrasal-verb",
        "idiom",
        "other"
    ]);
    let registers = json!([
        "neutral",
        "formal",
        "informal",
        "academic",
        "business",
        "legal",
        "literary",
        "technical",
        "spoken",
        "written",
        "slang",
        "archaic"
    ]);

    json!({
        "type": "object",
        "properties": {
            "aliases": {
                "type": "array",
                "maxItems": 12,
                "items": { "type": "string" }
            },
            "pronunciations": {
                "type": "array",
                "minItems": 1,
                "maxItems": 3,
                "items": {
                    "type": "object",
                    "properties": {
                        "ipa": { "type": "string" },
                        "variant": {
                            "type": "string",
                            "enum": ["general", "uk", "us", "au", "other"]
                        },
                        "syllableBreakdown": { "type": "string" },
                        "stress": { "type": "string" }
                    },
                    "required": ["ipa", "variant"],
                    "additionalProperties": false
                }
            },
            "cefr": {
                "type": "string",
                "enum": ["A1", "A2", "B1", "B2", "C1", "C2"]
            },
            "registers": {
                "type": "array",
                "maxItems": 6,
                "items": { "type": "string", "enum": registers }
            },
            "partsOfSpeech": {
                "type": "array",
                "minItems": 1,
                "maxItems": 4,
                "items": { "type": "string", "enum": part_of_speech }
            },
            "meanings": {
                "type": "array",
                "minItems": 1,
                "maxItems": 3,
                "items": {
                    "type": "object",
                    "properties": {
                        "partOfSpeech": { "type": "string", "enum": part_of_speech },
                        "definitionEn": { "type": "string" },
                        "translationsTr": {
                            "type": "array",
                            "minItems": 1,
                            "maxItems": 4,
                            "items": { "type": "string" }
                        },
                        "registers": {
                            "type": "array",
                            "maxItems": 4,
                            "items": { "type": "string", "enum": registers }
                        },
                        "usageNoteEn": { "type": "string" },
                        "usageNoteTr": { "type": "string" }
                    },
                    "required": [
                        "partOfSpeech",
                        "definitionEn",
                        "translationsTr",
                        "registers"
                    ],
                    "additionalProperties": false
                }
            },
            "morphology": {
                "type": "object",
                "properties": {
                    "baseForm": { "type": "string" },
                    "root": { "type": "string" },
                    "prefix": { "type": "string" },
                    "suffix": { "type": "string" },
                    "inflectedForms": {
                        "type": "array",
                        "maxItems": 8,
                        "items": {
                            "type": "object",
                            "properties": {
                                "form": { "type": "string" },
                                "normalizedForm": { "type": "string" },
                                "type": {
                                    "type": "string",
                                    "enum": [
                                        "base",
                                        "plural",
                                        "past",
                                        "past-participle",
                                        "present-participle",
                                        "third-person-singular",
                                        "comparative",
                                        "superlative",
                                        "other"
                                    ]
                                }
                            },
                            "required": ["form", "normalizedForm", "type"],
                            "additionalProperties": false
                        }
                    },
                    "notesEn": { "type": "string" },
                    "notesTr": { "type": "string" }
                },
                "required": ["baseForm", "inflectedForms"],
                "additionalProperties": false
            },
            "etymology": {
                "type": "object",
                "properties": {
                    "explanationEn": { "type": "string" },
                    "explanationTr": { "type": "string" },
                    "certainty": {
                        "type": "string",
                        "enum": ["high", "medium", "low"]
                    },
                    "originLanguage": { "type": "string" },
                    "originForm": { "type": "string" }
                },
                "required": ["explanationEn", "explanationTr", "certainty"],
                "additionalProperties": false
            },
            "grammar": {
                "type": "object",
                "properties": {
                    "summaryEn": { "type": "string" },
                    "summaryTr": { "type": "string" }
                },
                "required": ["summaryEn", "summaryTr"],
                "additionalProperties": false
            },
            "examples": {
                "type": "array",
                "minItems": 3,
                "maxItems": 3,
                "items": {
                    "type": "object",
                    "properties": {
                        "sentenceEn": { "type": "string" },
                        "translationTr": { "type": "string" },
                        "registers": {
                            "type": "array",
                            "maxItems": 4,
                            "items": { "type": "string", "enum": registers }
                        },
                        "grammarLabel": { "type": "string" },
                        "targetForm": { "type": "string" },
                        "context": { "type": "string" }
                    },
                    "required": ["sentenceEn", "translationTr", "registers"],
                    "additionalProperties": false
                }
            }
        },
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
    })
}

fn preparation_prompt(
    normalized_word: &str,
    preferences: &AssistantGenerationPreferences,
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

    let morphology = fields
        .get_mut("morphology")
        .and_then(Value::as_object_mut)
        .ok_or_else(|| "Gemini returned incomplete morphology.".to_string())?;
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
            "generatorLabel": "Gemini 3.6 Flash",
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
    let (code, fallback) = match status {
        StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN => (
            "assistant_api_key_rejected",
            "The Gemini API key was rejected. Replace it in Settings.",
        ),
        StatusCode::TOO_MANY_REQUESTS => (
            "assistant_quota_exhausted",
            "The Gemini usage limit was reached. Wait for the quota to reset and try again.",
        ),
        StatusCode::BAD_REQUEST => (
            "assistant_request_rejected",
            "Gemini could not accept this vocabulary request.",
        ),
        _ => (
            "assistant_provider_error",
            "Gemini could not prepare this word right now.",
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

pub async fn generate_vocabulary_candidate(
    word: String,
    preferences: AssistantGenerationPreferences,
) -> Result<AssistantGenerationCandidateResponse, String> {
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
            "max_output_tokens": 4096
        },
        "response_format": {
            "type": "text",
            "mime_type": "application/json",
            "schema": response_schema()
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

    Ok(AssistantGenerationCandidateResponse {
        value,
        model: ASSISTANT_MODEL,
        usage: response.usage,
    })
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::{entry_slug, normalize_aliases, normalize_headword, response_schema};

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
    fn generation_schema_requests_only_three_canonical_examples() {
        let schema = response_schema();

        assert_eq!(schema["properties"]["examples"]["minItems"], json!(3));
        assert_eq!(schema["properties"]["examples"]["maxItems"], json!(3));
        assert!(schema.get("anyOf").is_none());
        assert!(schema["properties"].get("generation").is_none());
        assert!(schema["properties"].get("createdAt").is_none());
    }

    #[test]
    fn removes_duplicate_and_base_word_aliases() {
        let mut value = json!({ "aliases": ["maintain", "Maintained", "maintained"] });
        normalize_aliases(&mut value, "maintain");
        assert_eq!(value["aliases"], json!(["Maintained"]));
    }
}
