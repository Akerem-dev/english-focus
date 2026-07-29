use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use std::time::Duration;

use reqwest::{header::CONTENT_TYPE, Client, StatusCode, Url};
use serde::{Deserialize, Serialize};

const FREE_DICTIONARY_BASE_URL: &str = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const REQUEST_TIMEOUT_SECONDS: u64 = 6;
const MAX_AUDIO_BYTES: usize = 2_000_000;
const CACHE_LIMIT: usize = 128;
const ALLOWED_AUDIO_HOSTS: &[&str] = &["api.dictionaryapi.dev", "ssl.gstatic.com"];

#[derive(Clone)]
enum CachedPronunciation {
    Found(String),
    Missing,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PronunciationAudio {
    bytes: Vec<u8>,
    mime_type: String,
}

#[derive(Debug, Deserialize)]
struct FreeDictionaryEntry {
    #[serde(default)]
    phonetics: Vec<FreeDictionaryPhonetic>,
}

#[derive(Debug, Deserialize)]
struct FreeDictionaryPhonetic {
    #[serde(default)]
    audio: String,
}

static PRONUNCIATION_CACHE: OnceLock<Mutex<HashMap<String, CachedPronunciation>>> = OnceLock::new();

fn cache() -> &'static Mutex<HashMap<String, CachedPronunciation>> {
    PRONUNCIATION_CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

fn cached_pronunciation(word: &str) -> Option<CachedPronunciation> {
    cache().lock().ok()?.get(word).cloned()
}

fn remember_pronunciation(word: String, pronunciation: CachedPronunciation) {
    let Ok(mut entries) = cache().lock() else {
        return;
    };

    if entries.len() >= CACHE_LIMIT {
        entries.clear();
    }

    entries.insert(word, pronunciation);
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
        return Err("assistant_pronunciation_invalid_word".to_string());
    }

    Ok(normalized)
}

fn dictionary_url(word: &str) -> Result<Url, String> {
    let mut url = Url::parse(FREE_DICTIONARY_BASE_URL)
        .map_err(|error| format!("assistant_pronunciation_unavailable: {error}"))?;

    url.path_segments_mut()
        .map_err(|_| "assistant_pronunciation_unavailable: Invalid dictionary URL.".to_string())?
        .push(word);

    Ok(url)
}

fn normalize_audio_url(raw_url: &str) -> Option<Url> {
    let trimmed = raw_url.trim();
    if trimmed.is_empty() {
        return None;
    }

    let candidate = if trimmed.starts_with("//") {
        format!("https:{trimmed}")
    } else {
        trimmed.to_string()
    };
    let url = Url::parse(&candidate).ok()?;
    let host = url.host_str()?;

    if url.scheme() != "https" || !ALLOWED_AUDIO_HOSTS.contains(&host) {
        return None;
    }

    Some(url)
}

fn first_audio_url(entries: &[FreeDictionaryEntry]) -> Option<Url> {
    entries
        .iter()
        .flat_map(|entry| entry.phonetics.iter())
        .find_map(|phonetic| normalize_audio_url(&phonetic.audio))
}

async fn fetch_dictionary_entries(
    client: &Client,
    word: &str,
) -> Result<Vec<FreeDictionaryEntry>, String> {
    let response = client
        .get(dictionary_url(word)?)
        .send()
        .await
        .map_err(|error| format!("assistant_pronunciation_unavailable: {error}"))?;

    match response.status() {
        status if status.is_success() => response
            .json::<Vec<FreeDictionaryEntry>>()
            .await
            .map_err(|error| format!("assistant_pronunciation_unavailable: {error}")),
        StatusCode::NOT_FOUND => Ok(Vec::new()),
        status => Err(format!(
            "assistant_pronunciation_unavailable: Dictionary returned {status}."
        )),
    }
}

async fn resolve_audio_url(client: &Client, word: &str) -> Result<Option<Url>, String> {
    if let Some(cached) = cached_pronunciation(word) {
        return match cached {
            CachedPronunciation::Found(audio_url) => Url::parse(&audio_url)
                .map(Some)
                .map_err(|error| format!("assistant_pronunciation_unavailable: {error}")),
            CachedPronunciation::Missing => Ok(None),
        };
    }

    let entries = fetch_dictionary_entries(client, word).await?;
    let Some(audio_url) = first_audio_url(&entries) else {
        remember_pronunciation(word.to_string(), CachedPronunciation::Missing);
        return Ok(None);
    };

    remember_pronunciation(
        word.to_string(),
        CachedPronunciation::Found(audio_url.to_string()),
    );
    Ok(Some(audio_url))
}

async fn download_audio(client: &Client, url: Url) -> Result<PronunciationAudio, String> {
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|error| format!("assistant_pronunciation_unavailable: {error}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "assistant_pronunciation_unavailable: Audio returned {}.",
            response.status()
        ));
    }

    if response
        .content_length()
        .is_some_and(|length| length > MAX_AUDIO_BYTES as u64)
    {
        return Err("assistant_pronunciation_unavailable: Audio file is too large.".to_string());
    }

    let mime_type = response
        .headers()
        .get(CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or("audio/mpeg")
        .split(';')
        .next()
        .unwrap_or("audio/mpeg")
        .to_string();

    if !mime_type.starts_with("audio/") {
        return Err("assistant_pronunciation_unavailable: Invalid audio content type.".to_string());
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|error| format!("assistant_pronunciation_unavailable: {error}"))?;

    if bytes.is_empty() || bytes.len() > MAX_AUDIO_BYTES {
        return Err("assistant_pronunciation_unavailable: Invalid audio file.".to_string());
    }

    Ok(PronunciationAudio {
        bytes: bytes.to_vec(),
        mime_type,
    })
}

#[tauri::command]
pub async fn assistant_get_pronunciation_audio(
    word: String,
) -> Result<Option<PronunciationAudio>, String> {
    let normalized = normalize_headword(&word)?;
    let client = Client::builder()
        .timeout(Duration::from_secs(REQUEST_TIMEOUT_SECONDS))
        .user_agent("English-Focus/1.0 pronunciation")
        .build()
        .map_err(|error| format!("assistant_pronunciation_unavailable: {error}"))?;
    let Some(audio_url) = resolve_audio_url(&client, &normalized).await? else {
        return Ok(None);
    };

    download_audio(&client, audio_url).await.map(Some)
}

#[cfg(test)]
mod tests {
    use super::{normalize_audio_url, normalize_headword};

    #[test]
    fn normalizes_safe_headwords() {
        assert_eq!(normalize_headword("  Look   up ").unwrap(), "look up");
        assert_eq!(normalize_headword("Mother’s").unwrap(), "mother's");
        assert!(normalize_headword("word!").is_err());
    }

    #[test]
    fn accepts_only_known_https_audio_hosts() {
        assert!(normalize_audio_url(
            "https://api.dictionaryapi.dev/media/pronunciations/en/test.mp3"
        )
        .is_some());
        assert!(
            normalize_audio_url("//ssl.gstatic.com/dictionary/static/sounds/test.mp3").is_some()
        );
        assert!(normalize_audio_url("http://api.dictionaryapi.dev/test.mp3").is_none());
        assert!(normalize_audio_url("https://example.com/test.mp3").is_none());
    }
}
