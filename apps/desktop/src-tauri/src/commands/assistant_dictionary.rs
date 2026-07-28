use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use std::time::Duration;

use reqwest::{Client, StatusCode, Url};
use serde::Deserialize;

const FREE_DICTIONARY_BASE_URL: &str = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const DATAMUSE_WORDS_URL: &str = "https://api.datamuse.com/words";
const CACHE_LIMIT: usize = 2_000;

#[derive(Clone)]
enum CachedValidation {
    Found,
    Missing(Vec<String>),
}

#[derive(Debug, Deserialize)]
struct DatamuseCandidate {
    word: String,
}

static VALIDATION_CACHE: OnceLock<Mutex<HashMap<String, CachedValidation>>> = OnceLock::new();

fn cache() -> &'static Mutex<HashMap<String, CachedValidation>> {
    VALIDATION_CACHE.get_or_init(|| Mutex::new(HashMap::new()))
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
        || !normalized.chars().all(|character| {
            character.is_ascii_alphabetic() || matches!(character, ' ' | '-' | '\'')
        })
    {
        return Err("Enter one English word or a short phrasal verb.".to_string());
    }

    Ok(normalized)
}

fn cached_validation(word: &str) -> Option<CachedValidation> {
    cache().lock().ok()?.get(word).cloned()
}

fn remember_validation(word: String, validation: CachedValidation) {
    let Ok(mut entries) = cache().lock() else {
        return;
    };

    if entries.len() >= CACHE_LIMIT {
        entries.clear();
    }

    entries.insert(word, validation);
}

fn missing_word_error(word: &str, suggestions: &[String]) -> String {
    let compact_suggestions = suggestions
        .iter()
        .take(5)
        .map(String::as_str)
        .collect::<Vec<_>>()
        .join(",");

    format!("assistant_word_not_found|{word}|{compact_suggestions}")
}

fn dictionary_url(word: &str) -> Result<Url, String> {
    let mut url = Url::parse(FREE_DICTIONARY_BASE_URL).map_err(|error| {
        format!("assistant_dictionary_unavailable: Invalid dictionary URL: {error}")
    })?;

    url.path_segments_mut()
        .map_err(|_| "assistant_dictionary_unavailable: Invalid dictionary URL.".to_string())?
        .push(word);

    Ok(url)
}

async fn free_dictionary_contains(client: &Client, word: &str) -> Result<bool, String> {
    let response = client
        .get(dictionary_url(word)?)
        .send()
        .await
        .map_err(|error| {
            format!(
                "assistant_dictionary_unavailable: Free Dictionary could not be reached: {error}"
            )
        })?;

    match response.status() {
        status if status.is_success() => Ok(true),
        StatusCode::NOT_FOUND => Ok(false),
        status => Err(format!(
            "assistant_dictionary_unavailable: Free Dictionary returned {status}."
        )),
    }
}

async fn datamuse_candidates(client: &Client, word: &str) -> Result<Vec<String>, String> {
    let mut url = Url::parse(DATAMUSE_WORDS_URL).map_err(|error| {
        format!("assistant_dictionary_unavailable: Invalid Datamuse URL: {error}")
    })?;

    url.query_pairs_mut()
        .append_pair("sp", word)
        .append_pair("max", "8");

    let response = client.get(url).send().await.map_err(|error| {
        format!("assistant_dictionary_unavailable: Datamuse could not be reached: {error}")
    })?;

    if !response.status().is_success() {
        return Err(format!(
            "assistant_dictionary_unavailable: Datamuse returned {}.",
            response.status()
        ));
    }

    let candidates = response
        .json::<Vec<DatamuseCandidate>>()
        .await
        .map_err(|error| {
            format!("assistant_dictionary_unavailable: Datamuse returned invalid data: {error}")
        })?;

    let mut unique = Vec::new();
    for candidate in candidates {
        let normalized = candidate
            .word
            .trim()
            .replace('’', "'")
            .split_whitespace()
            .collect::<Vec<_>>()
            .join(" ")
            .to_ascii_lowercase();

        if !normalized.is_empty() && !unique.contains(&normalized) {
            unique.push(normalized);
        }
    }

    Ok(unique)
}

pub async fn validate_headword(word: &str) -> Result<(), String> {
    let normalized = normalize_headword(word)?;

    if let Some(validation) = cached_validation(&normalized) {
        return match validation {
            CachedValidation::Found => Ok(()),
            CachedValidation::Missing(suggestions) => {
                Err(missing_word_error(&normalized, &suggestions))
            }
        };
    }

    let client = Client::builder()
        .timeout(Duration::from_secs(8))
        .user_agent("English-Focus/1.0 dictionary-validation")
        .build()
        .map_err(|error| {
            format!("assistant_dictionary_unavailable: Dictionary client could not start: {error}")
        })?;

    let dictionary_result = free_dictionary_contains(&client, &normalized).await;
    if matches!(dictionary_result, Ok(true)) {
        remember_validation(normalized, CachedValidation::Found);
        return Ok(());
    }

    let datamuse_result = datamuse_candidates(&client, &normalized).await;
    if let Ok(candidates) = &datamuse_result {
        if candidates.iter().any(|candidate| candidate == &normalized) {
            remember_validation(normalized, CachedValidation::Found);
            return Ok(());
        }
    }

    match (dictionary_result, datamuse_result) {
        (Ok(false), Ok(candidates)) => {
            let suggestions = candidates
                .into_iter()
                .filter(|candidate| candidate != &normalized)
                .take(5)
                .collect::<Vec<_>>();

            remember_validation(
                normalized.clone(),
                CachedValidation::Missing(suggestions.clone()),
            );

            Err(missing_word_error(&normalized, &suggestions))
        }
        (Err(dictionary_error), Err(datamuse_error)) => Err(format!(
            "assistant_dictionary_unavailable: Both dictionary checks failed. {dictionary_error} {datamuse_error}"
        )),
        (Err(error), Ok(_)) | (Ok(false), Err(error)) => Err(error),
        (Ok(true), _) => Ok(()),
    }
}

#[cfg(test)]
mod tests {
    use super::{missing_word_error, normalize_headword};

    #[test]
    fn normalizes_supported_headwords() {
        assert_eq!(normalize_headword("  Look   up ").unwrap(), "look up");
        assert_eq!(normalize_headword("Mother’s").unwrap(), "mother's");
        assert!(normalize_headword("word!").is_err());
    }

    #[test]
    fn creates_compact_not_found_errors() {
        assert_eq!(
            missing_word_error(
                "composive",
                &["composite".to_string(), "compulsive".to_string()]
            ),
            "assistant_word_not_found|composive|composite,compulsive"
        );
    }
}
