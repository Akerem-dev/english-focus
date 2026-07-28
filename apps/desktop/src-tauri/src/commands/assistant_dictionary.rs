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
struct FreeDictionaryEntry {
    word: String,
    #[serde(default)]
    meanings: Vec<FreeDictionaryMeaning>,
}

#[derive(Debug, Deserialize)]
struct FreeDictionaryMeaning {
    #[serde(default)]
    definitions: Vec<FreeDictionaryDefinition>,
}

#[derive(Debug, Deserialize)]
struct FreeDictionaryDefinition {
    definition: String,
}

#[derive(Debug, Deserialize)]
struct DatamuseCandidate {
    word: String,
    #[serde(default)]
    defs: Vec<String>,
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

fn definition_is_primary_lemma(definition: &str) -> bool {
    let normalized = definition.trim().to_ascii_lowercase();

    if normalized.is_empty() {
        return false;
    }

    const NON_LEMMA_MARKERS: &[&str] = &[
        "plural of ",
        "singular of ",
        "simple past tense",
        "past participle of ",
        "present participle of ",
        "third-person singular",
        "comparative form of ",
        "superlative form of ",
        "alternative form of ",
        "alternative spelling of ",
        "obsolete spelling of ",
        "nonstandard spelling of ",
        "pronunciation spelling of ",
        "eye dialect spelling of ",
        "abbreviation of ",
        "acronym of ",
        "initialism of ",
        "symbol for ",
        "contraction of ",
    ];

    !NON_LEMMA_MARKERS
        .iter()
        .any(|marker| normalized.contains(marker))
}

fn entry_has_primary_definition(entry: &FreeDictionaryEntry, expected_word: &str) -> bool {
    entry.word.trim().eq_ignore_ascii_case(expected_word)
        && entry.meanings.iter().any(|meaning| {
            meaning
                .definitions
                .iter()
                .any(|definition| definition_is_primary_lemma(&definition.definition))
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

async fn free_dictionary_contains_primary_lemma(
    client: &Client,
    word: &str,
) -> Result<bool, String> {
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
        status if status.is_success() => {
            let entries = response
                .json::<Vec<FreeDictionaryEntry>>()
                .await
                .map_err(|error| {
                    format!(
                        "assistant_dictionary_unavailable: Free Dictionary returned invalid data: {error}"
                    )
                })?;

            Ok(entries
                .iter()
                .any(|entry| entry_has_primary_definition(entry, word)))
        }
        StatusCode::NOT_FOUND => Ok(false),
        status => Err(format!(
            "assistant_dictionary_unavailable: Free Dictionary returned {status}."
        )),
    }
}

fn levenshtein_distance(left: &str, right: &str) -> usize {
    let right_chars = right.chars().collect::<Vec<_>>();
    let mut previous = (0..=right_chars.len()).collect::<Vec<_>>();

    for (left_index, left_character) in left.chars().enumerate() {
        let mut current = Vec::with_capacity(right_chars.len() + 1);
        current.push(left_index + 1);

        for (right_index, right_character) in right_chars.iter().enumerate() {
            let insertion = current[right_index] + 1;
            let deletion = previous[right_index + 1] + 1;
            let substitution =
                previous[right_index] + usize::from(left_character != *right_character);
            current.push(insertion.min(deletion).min(substitution));
        }

        previous = current;
    }

    previous[right_chars.len()]
}

fn maximum_suggestion_distance(word: &str) -> usize {
    match word.chars().count() {
        0..=4 => 1,
        5..=7 => 2,
        _ => 3,
    }
}

async fn datamuse_candidates(client: &Client, word: &str) -> Result<Vec<String>, String> {
    let mut url = Url::parse(DATAMUSE_WORDS_URL).map_err(|error| {
        format!("assistant_dictionary_unavailable: Invalid Datamuse URL: {error}")
    })?;

    url.query_pairs_mut()
        .append_pair("sp", word)
        .append_pair("md", "d")
        .append_pair("max", "12");

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

    let maximum_distance = maximum_suggestion_distance(word);
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

        if normalized.is_empty()
            || normalized == word
            || candidate.defs.is_empty()
            || levenshtein_distance(word, &normalized) > maximum_distance
            || unique.contains(&normalized)
        {
            continue;
        }

        unique.push(normalized);

        if unique.len() == 5 {
            break;
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

    if free_dictionary_contains_primary_lemma(&client, &normalized).await? {
        remember_validation(normalized, CachedValidation::Found);
        return Ok(());
    }

    let suggestions = datamuse_candidates(&client, &normalized)
        .await
        .unwrap_or_default();

    remember_validation(
        normalized.clone(),
        CachedValidation::Missing(suggestions.clone()),
    );

    Err(missing_word_error(&normalized, &suggestions))
}

#[cfg(test)]
mod tests {
    use super::{
        definition_is_primary_lemma, levenshtein_distance, maximum_suggestion_distance,
        missing_word_error, normalize_headword,
    };

    #[test]
    fn normalizes_supported_headwords() {
        assert_eq!(normalize_headword("  Look   up ").unwrap(), "look up");
        assert_eq!(normalize_headword("Mother’s").unwrap(), "mother's");
        assert!(normalize_headword("word!").is_err());
    }

    #[test]
    fn accepts_direct_definitions_and_rejects_non_lemma_definitions() {
        assert!(definition_is_primary_lemma(
            "To assign something for a particular purpose."
        ));
        assert!(!definition_is_primary_lemma("plural of da"));
        assert!(!definition_is_primary_lemma(
            "Pronunciation spelling of that's."
        ));
        assert!(!definition_is_primary_lemma(
            "Simple past tense and past participle of allocate."
        ));
        assert!(!definition_is_primary_lemma(
            "Initialism of data acquisition system."
        ));
    }

    #[test]
    fn limits_suggestions_to_nearby_spellings() {
        assert_eq!(levenshtein_distance("composive", "compulsive"), 2);
        assert_eq!(levenshtein_distance("das", "dad"), 1);
        assert_eq!(maximum_suggestion_distance("das"), 1);
        assert_eq!(maximum_suggestion_distance("composive"), 3);
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
