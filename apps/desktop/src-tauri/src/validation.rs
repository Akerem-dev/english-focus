use std::collections::HashSet;
use std::sync::OnceLock;

use jsonschema::Validator;
use serde_json::Value;

const VOCABULARY_ENTRY_SCHEMA: &str = include_str!("../schemas/vocabulary-entry.schema.json");
const APP_SETTINGS_SCHEMA: &str = include_str!("../schemas/app-settings.schema.json");
const VOCABULARY_USER_METADATA_SCHEMA: &str =
    include_str!("../schemas/vocabulary-user-metadata.schema.json");

static VOCABULARY_ENTRY_VALIDATOR: OnceLock<Result<Validator, String>> = OnceLock::new();
static APP_SETTINGS_VALIDATOR: OnceLock<Result<Validator, String>> = OnceLock::new();
static VOCABULARY_USER_METADATA_VALIDATOR: OnceLock<Result<Validator, String>> = OnceLock::new();

fn compile_validator(schema: &str, label: &str) -> Result<Validator, String> {
    let schema: Value = serde_json::from_str(schema)
        .map_err(|error| format!("Bundled {label} JSON Schema is invalid: {error}"))?;
    jsonschema::validator_for(&schema)
        .map_err(|error| format!("Bundled {label} JSON Schema could not compile: {error}"))
}

fn validator<'a>(
    cell: &'a OnceLock<Result<Validator, String>>,
    schema: &str,
    label: &str,
) -> Result<&'a Validator, String> {
    match cell.get_or_init(|| compile_validator(schema, label)) {
        Ok(validator) => Ok(validator),
        Err(error) => Err(error.clone()),
    }
}

fn validate_schema(value: &Value, validator: &Validator, label: &str) -> Result<(), String> {
    let errors: Vec<String> = validator
        .iter_errors(value)
        .take(5)
        .map(|error| error.to_string())
        .collect();

    if errors.is_empty() {
        Ok(())
    } else {
        Err(format!(
            "{label} failed schema validation: {}",
            errors.join("; ")
        ))
    }
}

fn validate_trimmed_strings(value: &Value, path: &str) -> Result<(), String> {
    match value {
        Value::String(text) if text.trim() != text => Err(format!(
            "String at {path} must not have leading or trailing whitespace."
        )),
        Value::Array(items) => {
            for (index, item) in items.iter().enumerate() {
                validate_trimmed_strings(item, &format!("{path}[{index}]"))?;
            }
            Ok(())
        }
        Value::Object(fields) => {
            for (key, field) in fields {
                validate_trimmed_strings(field, &format!("{path}.{key}"))?;
            }
            Ok(())
        }
        _ => Ok(()),
    }
}

fn validate_vocabulary_semantics(entry: &Value) -> Result<(), String> {
    let declared_parts: HashSet<&str> = entry["partsOfSpeech"]
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(Value::as_str)
        .collect();

    for meaning in entry["meanings"].as_array().into_iter().flatten() {
        let Some(part_of_speech) = meaning["partOfSpeech"].as_str() else {
            continue;
        };
        if !declared_parts.contains(part_of_speech) {
            return Err(format!(
                "Meaning part of speech '{part_of_speech}' is missing from partsOfSpeech."
            ));
        }
    }

    let mut example_ids = HashSet::new();
    for example in entry["examples"].as_array().into_iter().flatten() {
        let Some(id) = example["id"].as_str() else {
            continue;
        };
        if !example_ids.insert(id) {
            return Err("Primary example identifiers must be unique.".to_string());
        }
    }

    Ok(())
}

pub(crate) fn validate_vocabulary_entry(entry: &Value) -> Result<(), String> {
    let validator = validator(
        &VOCABULARY_ENTRY_VALIDATOR,
        VOCABULARY_ENTRY_SCHEMA,
        "vocabulary entry",
    )?;
    validate_schema(entry, validator, "Vocabulary entry")?;
    validate_trimmed_strings(entry, "entry")?;
    validate_vocabulary_semantics(entry)
}

pub(crate) fn validate_app_settings(settings: &Value) -> Result<(), String> {
    let validator = validator(
        &APP_SETTINGS_VALIDATOR,
        APP_SETTINGS_SCHEMA,
        "application settings",
    )?;
    validate_schema(settings, validator, "Application settings")?;
    validate_trimmed_strings(settings, "settings")
}

pub(crate) fn validate_vocabulary_user_metadata(metadata: &Value) -> Result<(), String> {
    let validator = validator(
        &VOCABULARY_USER_METADATA_VALIDATOR,
        VOCABULARY_USER_METADATA_SCHEMA,
        "vocabulary user metadata",
    )?;
    validate_schema(metadata, validator, "Vocabulary user metadata")?;
    validate_trimmed_strings(metadata, "metadata")
}

#[cfg(test)]
mod tests {
    use serde_json::{json, Value};

    use super::{
        validate_app_settings, validate_vocabulary_entry, validate_vocabulary_user_metadata,
    };

    #[test]
    fn accepts_the_bundled_maintain_entry() {
        let entry: Value = serde_json::from_str(include_str!(
            "../../src/content/core/entries/maintain.entry.json"
        ))
        .expect("maintain fixture must be valid JSON");

        validate_vocabulary_entry(&entry)
            .expect("maintain fixture must satisfy the native contract");
    }

    #[test]
    fn rejects_incomplete_vocabulary_at_the_native_boundary() {
        let entry = json!({
            "schemaVersion": "1.0.0",
            "id": "word:test",
            "word": "test",
            "normalizedWord": "test"
        });

        assert!(validate_vocabulary_entry(&entry).is_err());
    }

    #[test]
    fn accepts_complete_application_settings() {
        let settings = json!({
            "schemaVersion": "1.0.0",
            "general": { "interfaceLanguage": "en", "translationLanguage": "tr" },
            "content": {
                "showEtymology": true,
                "showCommonMistakes": true,
                "exampleSentenceCount": 10
            },
            "data": { "automaticBackups": true, "backupFrequency": "weekly" },
            "appearance": { "theme": "system", "reducedMotion": false, "interfaceSize": "medium" },
            "instruction": {
                "explanationLanguage": "tr",
                "detailLevel": "maximum",
                "targetProficiency": "B2",
                "exampleCount": 10,
                "includeWordFamily": true,
                "includeGrammarNotes": true,
                "includeCommonMistakes": true,
                "includeEtymology": true,
                "includeUsageTips": true
            },
            "updatedAt": "2026-07-16T12:00:00.000Z"
        });

        validate_app_settings(&settings)
            .expect("complete settings must satisfy the native contract");
    }

    #[test]
    fn rejects_unknown_settings_fields() {
        let settings = json!({ "schemaVersion": "1.0.0", "unexpected": true });

        assert!(validate_app_settings(&settings).is_err());
    }

    #[test]
    fn rejects_malformed_vocabulary_metadata() {
        let metadata = json!({
            "normalizedWord": "test",
            "favorite": false,
            "tags": [{ "name": "missing required fields" }],
            "note": "",
            "learningStatus": "new",
            "reviewStatus": "reviewed",
            "viewCount": 0,
            "createdAt": "2026-07-16T12:00:00.000Z",
            "updatedAt": "2026-07-16T12:00:00.000Z"
        });

        assert!(validate_vocabulary_user_metadata(&metadata).is_err());
    }
}
