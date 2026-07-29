use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use std::time::Duration;

use reqwest::{Client, StatusCode, Url};
use serde::Deserialize;
use tauri::ipc::Response;

const ENGLISH_DICTIONARY_BASE_URL: &str = "https://englishdictionaryapi.com/api/v1/words/";
const FREE_DICTIONARY_BASE_URL: &str = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const REQUEST_TIMEOUT_SECONDS: u64 = 5;
const MAX_AUDIO_BYTES: usize = 2_000_000;
const CACHE_LIMIT: usize = 128;
const ALLOWED_AUDIO_HOSTS: &[&str] = &[
    "api.dictionaryapi.dev",
    "ssl.gstatic.com",
    "upload.wikimedia.org",
    "commons.wikimedia.org",
];

#[derive(Clone)]
enum CachedPronunciation {
    Found(Vec<String>),
    Missing,
}

#[derive(Debug, Deserialize)]
struct EnglishDictionaryEntry {
    pronunciation: Option<EnglishDictionaryPronunciation>,
}

#[derive(Debug, Deserialize)]
struct EnglishDictionaryPronunciation {
    #[serde(rename = "audioUrl")]
    audio_url: Option<String>,
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

fn provider_url(base_url: &str, word: &str) -> Result<Url, String> {
    let mut url = Url::parse(base_url)
        .map_err(|error| format!("assistant_pronunciation_unavailable: {error}"))?;

    url.path_segments_mut()
        .map_err(|_| "assistant_pronunciation_unavailable: Invalid provider URL.".to_string())?
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

fn push_unique_url(urls: &mut Vec<Url>, candidate: Url) {
    if !urls.iter().any(|url| url.as_str() == candidate.as_str()) {
        urls.push(candidate);
    }
}

async fn fetch_english_dictionary_urls(client: &Client, word: &str) -> Result<Vec<Url>, String> {
    let response = client
        .get(provider_url(ENGLISH_DICTIONARY_BASE_URL, word)?)
        .send()
        .await
        .map_err(|error| format!("assistant_pronunciation_unavailable: {error}"))?;

    match response.status() {
        status if status.is_success() => {
            let entry = response
                .json::<EnglishDictionaryEntry>()
                .await
                .map_err(|error| format!("assistant_pronunciation_unavailable: {error}"))?;
            Ok(entry
                .pronunciation
                .and_then(|pronunciation| pronunciation.audio_url)
                .and_then(|audio_url| normalize_audio_url(&audio_url))
                .into_iter()
                .collect())
        }
        StatusCode::NOT_FOUND => Ok(Vec::new()),
        status => Err(format!(
            "assistant_pronunciation_unavailable: EnglishDictionaryAPI returned {status}."
        )),
    }
}

async fn fetch_free_dictionary_urls(client: &Client, word: &str) -> Result<Vec<Url>, String> {
    let response = client
        .get(provider_url(FREE_DICTIONARY_BASE_URL, word)?)
        .send()
        .await
        .map_err(|error| format!("assistant_pronunciation_unavailable: {error}"))?;

    match response.status() {
        status if status.is_success() => {
            let entries = response
                .json::<Vec<FreeDictionaryEntry>>()
                .await
                .map_err(|error| format!("assistant_pronunciation_unavailable: {error}"))?;
            let mut urls = Vec::new();

            for phonetic in entries.iter().flat_map(|entry| entry.phonetics.iter()) {
                if let Some(url) = normalize_audio_url(&phonetic.audio) {
                    push_unique_url(&mut urls, url);
                }
            }

            Ok(urls)
        }
        StatusCode::NOT_FOUND => Ok(Vec::new()),
        status => Err(format!(
            "assistant_pronunciation_unavailable: DictionaryAPI.dev returned {status}."
        )),
    }
}

async fn resolve_audio_urls(client: &Client, word: &str) -> Result<Vec<Url>, String> {
    if let Some(cached) = cached_pronunciation(word) {
        return match cached {
            CachedPronunciation::Found(audio_urls) => Ok(audio_urls
                .into_iter()
                .filter_map(|audio_url| Url::parse(&audio_url).ok())
                .collect()),
            CachedPronunciation::Missing => Ok(Vec::new()),
        };
    }

    let mut urls = Vec::new();
    let mut provider_responded = false;

    if let Ok(provider_urls) = fetch_english_dictionary_urls(client, word).await {
        provider_responded = true;
        for url in provider_urls {
            push_unique_url(&mut urls, url);
        }
    }

    if let Ok(provider_urls) = fetch_free_dictionary_urls(client, word).await {
        provider_responded = true;
        for url in provider_urls {
            push_unique_url(&mut urls, url);
        }
    }

    if urls.is_empty() {
        if provider_responded {
            remember_pronunciation(word.to_string(), CachedPronunciation::Missing);
        }
        return Ok(Vec::new());
    }

    remember_pronunciation(
        word.to_string(),
        CachedPronunciation::Found(urls.iter().map(ToString::to_string).collect()),
    );
    Ok(urls)
}

fn is_supported_audio(bytes: &[u8]) -> bool {
    bytes.starts_with(b"ID3")
        || bytes
            .get(0..2)
            .is_some_and(|header| header[0] == 0xff && header[1] & 0xe0 == 0xe0)
        || bytes.starts_with(b"OggS")
        || (bytes.starts_with(b"RIFF") && bytes.get(8..12) == Some(b"WAVE"))
        || bytes.starts_with(b"fLaC")
        || bytes.starts_with(&[0x1a, 0x45, 0xdf, 0xa3])
        || bytes.get(4..8) == Some(b"ftyp")
}

async fn download_audio(client: &Client, url: Url) -> Result<Vec<u8>, String> {
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

    let bytes = response
        .bytes()
        .await
        .map_err(|error| format!("assistant_pronunciation_unavailable: {error}"))?;

    if bytes.is_empty() || bytes.len() > MAX_AUDIO_BYTES || !is_supported_audio(&bytes) {
        return Err("assistant_pronunciation_unavailable: Invalid audio file.".to_string());
    }

    Ok(bytes.to_vec())
}

#[tauri::command]
pub async fn assistant_get_pronunciation_audio(word: String) -> Result<Response, String> {
    let normalized = normalize_headword(&word)?;
    let client = Client::builder()
        .timeout(Duration::from_secs(REQUEST_TIMEOUT_SECONDS))
        .user_agent("English-Focus/1.0 pronunciation")
        .build()
        .map_err(|error| format!("assistant_pronunciation_unavailable: {error}"))?;
    let audio_urls = resolve_audio_urls(&client, &normalized).await?;

    for audio_url in audio_urls {
        if let Ok(bytes) = download_audio(&client, audio_url).await {
            return Ok(Response::new(bytes));
        }
    }

    Err("assistant_pronunciation_missing".to_string())
}

#[cfg(test)]
mod tests {
    use super::{is_supported_audio, normalize_audio_url, normalize_headword};

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
        assert!(
            normalize_audio_url("https://upload.wikimedia.org/wikipedia/commons/test.ogg")
                .is_some()
        );
        assert!(normalize_audio_url("http://api.dictionaryapi.dev/test.mp3").is_none());
        assert!(normalize_audio_url("https://example.com/test.mp3").is_none());
    }

    #[test]
    fn recognizes_common_audio_signatures() {
        assert!(is_supported_audio(b"ID3audio"));
        assert!(is_supported_audio(b"OggSaudio"));
        assert!(is_supported_audio(b"RIFF1234WAVEaudio"));
        assert!(!is_supported_audio(b"not audio"));
    }
}
