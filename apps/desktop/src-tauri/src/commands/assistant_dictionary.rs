use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use std::time::Duration;

use reqwest::{Client, StatusCode, Url};
use serde::Deserialize;

const FREE_DICTIONARY_BASE_URL: &str = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const WIKTIONARY_API_URL: &str = "https://en.wiktionary.org/w/api.php";
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

#[derive(Debug, Deserialize)]
struct WiktionaryParseResponse {
    parse: Option<WiktionaryParse>,
}

#[derive(Debug, Deserialize)]
struct WiktionaryParse {
    wikitext: String,
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

fn has_english_section(wikitext: &str) -> bool {
    wikitext.lines().any(|line| {
        line.trim()
            .chars()
            .filter(|character| !character.is_whitespace())
            .collect::<String>()
            .eq_ignore_ascii_case("==English==")
    })
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

async fn wiktionary_contains_english(client: &Client, word: &str) -> Result<bool, String> {
    let mut url = Url::parse(WIKTIONARY_API_URL).map_err(|error| {
        format!("assistant_dictionary_unavailable: Invalid Wiktionary URL: {error}")
    })?;

    url.query_pairs_mut()
        .append_pair("action", "parse")
        .append_pair("page", word)
        .append_pair("prop", "wikitext")
        .append_pair("redirects", "1")
        .append_pair("format", "json")
        .append_pair("formatversion", "2");

    let response = client.get(url).send().await.map_err(|error| {
        format!("assistant_dictionary_unavailable: Wiktionary could not be reached: {error}")
    })?;

    if !response.status().is_success() {
        return Err(format!(
            "assistant_dictionary_unavailable: Wiktionary returned {}.",
            response.status()
        ));
    }

    let payload = response
        .json::<WiktionaryParseResponse>()
        .await
        .map_err(|error| {
            format!("assistant_dictionary_unavailable: Wiktionary returned invalid data: {error}")
        })?;

    Ok(payload
        .parse
        .is_some_and(|page| has_english_section(&page.wikitext)))
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

        if !normalized.is_empty() && normalized != word && !unique.contains(&normalized) {
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

    let free_dictionary_result = free_dictionary_contains(&client, &normalized).await;
    if matches!(free_dictionary_result, Ok(true)) {
        remember_validation(normalized, CachedValidation::Found);
        return Ok(());
    }

    let wiktionary_result = wiktionary_contains_english(&client, &normalized).await;
    if matches!(wiktionary_result, Ok(true)) {
        remember_validation(normalized, CachedValidation::Found);
        return Ok(());
    }

    match (&free_dictionary_result, &wiktionary_result) {
        (Ok(false), Ok(false)) => {
            let suggestions = datamuse_candidates(&client, &normalized)
                .await
                .unwrap_or_default()
                .into_iter()
                .take(5)
                .collect::<Vec<_>>();

            remember_validation(
                normalized.clone(),
                CachedValidation::Missing(suggestions.clone()),
            );

            Err(missing_word_error(&normalized, &suggestions))
        }
        (Err(free_dictionary_error), Err(wiktionary_error)) => Err(format!(
            "assistant_dictionary_unavailable: Both authoritative dictionary checks failed. {free_dictionary_error} {wiktionary_error}"
        )),
        (Err(error), Ok(false)) | (Ok(false), Err(error)) => Err(error.clone()),
        (Ok(true), _) | (_, Ok(true)) => Ok(()),
    }
}

#[cfg(test)]
mod tests {
    use super::{has_english_section, missing_word_error, normalize_headword};

    #[test]
    fn normalizes_supported_headwords() {
        assert_eq!(normalize_headword("  Look   up ").unwrap(), "look up");
        assert_eq!(normalize_headword("Mother’s").unwrap(), "mother's");
        assert!(normalize_headword("word!").is_err());
    }

    #[test]
    fn detects_only_english_wiktionary_sections() {
        assert!(has_english_section("==English==\n===Noun==="));
        assert!(has_english_section("== English ==\n=== Verb ==="));
        assert!(!has_english_section("==German==\n===Noun==="));
        assert!(!has_english_section("This text mentions English without a section."));
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
