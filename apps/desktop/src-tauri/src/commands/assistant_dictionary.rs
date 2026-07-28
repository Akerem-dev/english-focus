use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use std::time::Duration;

use reqwest::{Client, StatusCode, Url};
use serde::Deserialize;

const FREE_DICTIONARY_BASE_URL: &str = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const DATAMUSE_WORDS_URL: &str = "https://api.datamuse.com/words";
const CACHE_LIMIT: usize = 2_000;
const REQUEST_TIMEOUT_SECONDS: u64 = 4;
const STANDARD_MIN_FREQUENCY_PER_MILLION: f64 = 0.02;
const SUGGESTION_MIN_FREQUENCY_PER_MILLION: f64 = 0.05;

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
    #[serde(default)]
    tags: Vec<String>,
    #[serde(default, rename = "defHeadword")]
    def_headword: Option<String>,
}

static VALIDATION_CACHE: OnceLock<Mutex<HashMap<String, CachedValidation>>> = OnceLock::new();

fn cache() -> &'static Mutex<HashMap<String, CachedValidation>> {
    VALIDATION_CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

fn normalize_lookup_word(word: &str) -> String {
    word.trim()
        .replace('’', "'")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .to_ascii_lowercase()
}

fn normalize_headword(word: &str) -> Result<String, String> {
    let normalized = normalize_lookup_word(word);

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

fn definition_is_standard_headword(definition: &str) -> bool {
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

    const NON_STANDARD_LABELS: &[&str] = &[
        "(obsolete)",
        "(archaic)",
        "(rare)",
        "(dialectal)",
        "(nonstandard)",
        "(historical)",
        "obsolete:",
        "archaic:",
        "rare:",
        "dialectal:",
        "nonstandard:",
    ];

    !NON_LEMMA_MARKERS
        .iter()
        .chain(NON_STANDARD_LABELS.iter())
        .any(|marker| normalized.contains(marker))
}

fn entry_has_standard_definition(entry: &FreeDictionaryEntry, expected_word: &str) -> bool {
    normalize_lookup_word(&entry.word) == expected_word
        && entry.meanings.iter().any(|meaning| {
            meaning
                .definitions
                .iter()
                .any(|definition| definition_is_standard_headword(&definition.definition))
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

async fn free_dictionary_contains_standard_word(
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
                .any(|entry| entry_has_standard_definition(entry, word)))
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

fn datamuse_frequency_per_million(candidate: &DatamuseCandidate) -> Option<f64> {
    candidate.tags.iter().find_map(|tag| {
        tag.strip_prefix("f:")
            .and_then(|value| value.parse::<f64>().ok())
    })
}

fn datamuse_has_standard_part_of_speech(candidate: &DatamuseCandidate) -> bool {
    candidate
        .tags
        .iter()
        .any(|tag| matches!(tag.as_str(), "n" | "v" | "adj" | "adv"))
}

fn datamuse_has_standard_definition(candidate: &DatamuseCandidate) -> bool {
    candidate
        .defs
        .iter()
        .any(|definition| definition_is_standard_headword(definition))
}

fn datamuse_candidate_is_standard(
    candidate: &DatamuseCandidate,
    expected_word: &str,
    minimum_frequency: f64,
    free_dictionary_match: bool,
) -> bool {
    let normalized_candidate = normalize_lookup_word(&candidate.word);
    let headword_matches = candidate
        .def_headword
        .as_deref()
        .map(normalize_lookup_word)
        .is_none_or(|headword| headword == expected_word);
    let has_dictionary_evidence = free_dictionary_match || datamuse_has_standard_definition(candidate);

    normalized_candidate == expected_word
        && headword_matches
        && has_dictionary_evidence
        && datamuse_has_standard_part_of_speech(candidate)
        && datamuse_frequency_per_million(candidate)
            .is_some_and(|frequency| frequency >= minimum_frequency)
}

fn datamuse_exact_url(word: &str) -> Result<Url, String> {
    let mut url = Url::parse(DATAMUSE_WORDS_URL).map_err(|error| {
        format!("assistant_dictionary_unavailable: Invalid Datamuse URL: {error}")
    })?;

    url.query_pairs_mut()
        .append_pair("sp", word)
        .append_pair("qe", "sp")
        .append_pair("md", "dfp")
        .append_pair("max", "1");

    Ok(url)
}

async fn datamuse_exact_candidate(
    client: &Client,
    word: &str,
) -> Result<Option<DatamuseCandidate>, String> {
    let response = client
        .get(datamuse_exact_url(word)?)
        .send()
        .await
        .map_err(|error| {
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

    Ok(candidates
        .into_iter()
        .find(|candidate| normalize_lookup_word(&candidate.word) == word))
}

async fn datamuse_candidates(client: &Client, word: &str) -> Result<Vec<String>, String> {
    let mut url = Url::parse(DATAMUSE_WORDS_URL).map_err(|error| {
        format!("assistant_dictionary_unavailable: Invalid Datamuse URL: {error}")
    })?;

    url.query_pairs_mut()
        .append_pair("sp", word)
        .append_pair("md", "dfp")
        .append_pair("max", "20");

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
        let normalized = normalize_lookup_word(&candidate.word);

        if normalized.is_empty()
            || normalized == word
            || candidate.def_headword.is_some()
            || levenshtein_distance(word, &normalized) > maximum_distance
            || !datamuse_candidate_is_standard(
                &candidate,
                &normalized,
                SUGGESTION_MIN_FREQUENCY_PER_MILLION,
                false,
            )
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
        .timeout(Duration::from_secs(REQUEST_TIMEOUT_SECONDS))
        .user_agent("English-Focus/1.0 dictionary-validation")
        .build()
        .map_err(|error| {
            format!("assistant_dictionary_unavailable: Dictionary client could not start: {error}")
        })?;

    let exact_candidate = datamuse_exact_candidate(&client, &normalized).await?;

    if let Some(candidate) = exact_candidate.as_ref() {
        if datamuse_candidate_is_standard(
            candidate,
            &normalized,
            STANDARD_MIN_FREQUENCY_PER_MILLION,
            false,
        ) {
            remember_validation(normalized, CachedValidation::Found);
            return Ok(());
        }

        let has_standard_usage = normalize_lookup_word(&candidate.word) == normalized
            && candidate
                .def_headword
                .as_deref()
                .map(normalize_lookup_word)
                .is_none_or(|headword| headword == normalized)
            && datamuse_has_standard_part_of_speech(candidate)
            && datamuse_frequency_per_million(candidate)
                .is_some_and(|frequency| frequency >= STANDARD_MIN_FREQUENCY_PER_MILLION);

        if has_standard_usage
            && free_dictionary_contains_standard_word(&client, &normalized)
                .await
                .unwrap_or(false)
        {
            remember_validation(normalized, CachedValidation::Found);
            return Ok(());
        }
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
        datamuse_candidate_is_standard, definition_is_standard_headword, levenshtein_distance,
        maximum_suggestion_distance, missing_word_error, normalize_headword, DatamuseCandidate,
        STANDARD_MIN_FREQUENCY_PER_MILLION,
    };

    fn datamuse_candidate(word: &str, definition: &str, frequency: f64) -> DatamuseCandidate {
        DatamuseCandidate {
            word: word.to_string(),
            defs: vec![definition.to_string()],
            tags: vec!["adj".to_string(), format!("f:{frequency}")],
            def_headword: None,
        }
    }

    #[test]
    fn normalizes_supported_headwords() {
        assert_eq!(normalize_headword("  Look   up ").unwrap(), "look up");
        assert_eq!(normalize_headword("Mother’s").unwrap(), "mother's");
        assert!(normalize_headword("word!").is_err());
    }

    #[test]
    fn accepts_current_definitions_and_rejects_nonstandard_entries() {
        assert!(definition_is_standard_headword(
            "To assign something for a particular purpose."
        ));
        assert!(!definition_is_standard_headword("plural of da"));
        assert!(!definition_is_standard_headword(
            "Pronunciation spelling of that's."
        ));
        assert!(!definition_is_standard_headword(
            "Simple past tense and past participle of allocate."
        ));
        assert!(!definition_is_standard_headword(
            "(obsolete) Compulsory; employing force or constraint."
        ));
    }

    #[test]
    fn requires_frequency_for_standard_learner_words() {
        let compulsive = datamuse_candidate("compulsive", "Driven by compulsion.", 1.2);
        let obscure = datamuse_candidate("zibar", "A type of sand dune.", 0.001);
        let obsolete = datamuse_candidate(
            "compulsative",
            "(obsolete) Compulsory; employing force or constraint.",
            0.001,
        );

        assert!(datamuse_candidate_is_standard(
            &compulsive,
            "compulsive",
            STANDARD_MIN_FREQUENCY_PER_MILLION,
            true,
        ));
        assert!(!datamuse_candidate_is_standard(
            &obscure,
            "zibar",
            STANDARD_MIN_FREQUENCY_PER_MILLION,
            true,
        ));
        assert!(!datamuse_candidate_is_standard(
            &obsolete,
            "compulsative",
            STANDARD_MIN_FREQUENCY_PER_MILLION,
            true,
        ));
    }

    #[test]
    fn limits_suggestions_to_nearby_spellings() {
        assert_eq!(levenshtein_distance("compulsative", "compulsive"), 2);
        assert_eq!(levenshtein_distance("zibab", "zibar"), 1);
        assert_eq!(maximum_suggestion_distance("zibab"), 2);
        assert_eq!(maximum_suggestion_distance("compulsative"), 3);
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
