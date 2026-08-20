use std::collections::HashSet;
use std::sync::OnceLock;

use serde::Deserialize;

use crate::grammar::types::GrammarLocalAnswer;

const ATLAS_SHARDS: &[&str] = &[
    include_str!("atlas_cache_01.json"),
    include_str!("atlas_cache_02.json"),
    include_str!("atlas_cache_03.json"),
    include_str!("atlas_cache_04.json"),
    include_str!("atlas_cache_05.json"),
    include_str!("atlas_cache_06.json"),
    include_str!("atlas_cache_07.json"),
    include_str!("atlas_cache_08.json"),
];

const EXPECTED_ATLAS_CARD_COUNT: usize = 156;
const KNOWN_FAIL_CLOSED_GAPS: &[&str] = &["A010", "A014", "A087", "A150"];

#[derive(Debug, Clone, Deserialize)]
struct EmbeddedAtlasCard {
    #[serde(rename = "id")]
    card_id: String,
    #[serde(rename = "t")]
    title: String,
    #[serde(rename = "c")]
    category: String,
    #[serde(rename = "a")]
    answer_text: String,
    #[serde(rename = "r")]
    core_rule_ids: Vec<String>,
    #[serde(rename = "s")]
    support_rule_ids: Vec<String>,
}

#[derive(Debug, Clone)]
struct AtlasCard {
    card_id: String,
    title: String,
    category: String,
    answer_text: String,
    core_rule_ids: Vec<String>,
    support_rule_ids: Vec<String>,
    normalized_title: String,
    normalized_aliases: Vec<String>,
    informative_title_tokens: usize,
}

static ATLAS_CARDS: OnceLock<Result<Vec<AtlasCard>, String>> = OnceLock::new();

fn normalize(value: &str) -> String {
    let lowered = value.replace(['’', '‘'], "'").to_lowercase();
    let mut output = String::with_capacity(lowered.len());
    let mut previous_space = true;

    for ch in lowered.chars() {
        if ch.is_alphanumeric() || ch == '\'' || ch == '-' {
            output.push(ch);
            previous_space = false;
        } else if !previous_space {
            output.push(' ');
            previous_space = true;
        }
    }

    output.trim().to_string()
}

fn informative_title_token_count(title: &str) -> usize {
    const TITLE_STOPWORDS: &[&str] = &["a", "an", "the", "and", "or", "vs", "to", "of", "in", "for"];

    normalize(title)
        .split_whitespace()
        .filter(|token| !TITLE_STOPWORDS.contains(token))
        .count()
}

fn generated_aliases(title: &str) -> [String; 8] {
    [
        format!("{title} nedir ve nasıl kullanılır?"),
        format!("{title} ne zaman kullanılır?"),
        format!("{title} için temel grammar kuralını Türkçe açıkla."),
        format!("{title} kullanım mantığını yeni başlayan birine anlat."),
        format!("{title} yapısını kısa ama net açıkla."),
        format!("{title} İngilizcede hangi durumda kullanılır?"),
        format!("{title} için doğru kullanım nasıl anlaşılır?"),
        format!(
            "{title} konusunda temel kural ve dikkat edilmesi gereken nokta nedir?"
        ),
    ]
}

fn parse_cards() -> Result<Vec<AtlasCard>, String> {
    let mut cards = Vec::with_capacity(EXPECTED_ATLAS_CARD_COUNT);

    for (index, shard) in ATLAS_SHARDS.iter().enumerate() {
        let parsed: Vec<EmbeddedAtlasCard> = serde_json::from_str(shard).map_err(|error| {
            format!(
                "grammar_atlas_cache_invalid|shard={}|{}",
                index + 1,
                error
            )
        })?;

        cards.extend(parsed.into_iter().map(|card| {
            let normalized_aliases = generated_aliases(&card.title)
                .into_iter()
                .map(|alias| normalize(&alias))
                .collect::<Vec<_>>();
            let normalized_title = normalize(&card.title);
            let informative_title_tokens = informative_title_token_count(&card.title);

            AtlasCard {
                card_id: card.card_id,
                title: card.title,
                category: card.category,
                answer_text: card.answer_text,
                core_rule_ids: card.core_rule_ids,
                support_rule_ids: card.support_rule_ids,
                normalized_title,
                normalized_aliases,
                informative_title_tokens,
            }
        }));
    }

    validate_cards(&cards)?;
    Ok(cards)
}

fn validate_cards(cards: &[AtlasCard]) -> Result<(), String> {
    if cards.len() != EXPECTED_ATLAS_CARD_COUNT {
        return Err(format!(
            "grammar_atlas_cache_count_mismatch|expected={EXPECTED_ATLAS_CARD_COUNT}|actual={}",
            cards.len()
        ));
    }

    let mut ids = HashSet::with_capacity(cards.len());
    for card in cards {
        if !ids.insert(card.card_id.as_str()) {
            return Err(format!("grammar_atlas_cache_duplicate|{}", card.card_id));
        }
    }

    for number in 1..=160 {
        let id = format!("A{number:03}");
        let expected_gap = KNOWN_FAIL_CLOSED_GAPS.contains(&id.as_str());
        let present = ids.contains(id.as_str());
        if expected_gap == present {
            return Err(format!(
                "grammar_atlas_cache_coverage_mismatch|id={id}|expected_gap={expected_gap}|present={present}"
            ));
        }
    }

    Ok(())
}

fn cards() -> Result<&'static [AtlasCard], String> {
    match ATLAS_CARDS.get_or_init(parse_cards) {
        Ok(cards) => Ok(cards.as_slice()),
        Err(error) => Err(error.clone()),
    }
}

fn normalized_phrase_present(question: &str, phrase: &str) -> bool {
    if question == phrase {
        return true;
    }

    question
        .strip_prefix(phrase)
        .is_some_and(|suffix| suffix.starts_with(' '))
        || question
            .strip_suffix(phrase)
            .is_some_and(|prefix| prefix.ends_with(' '))
        || question.contains(&format!(" {phrase} "))
}

fn to_answer(card: &AtlasCard, confidence: f32) -> GrammarLocalAnswer {
    GrammarLocalAnswer {
        source: "local-atlas-cache",
        card_id: card.card_id.clone(),
        topic_name: card.title.clone(),
        category: card.category.clone(),
        answer_text: card.answer_text.clone(),
        core_rule_ids: card.core_rule_ids.clone(),
        support_rule_ids: card.support_rule_ids.clone(),
        confidence,
    }
}

pub fn answer_atlas_local(question: &str) -> Result<Option<GrammarLocalAnswer>, String> {
    let normalized_question = normalize(question.trim());
    if normalized_question.is_empty() {
        return Ok(None);
    }

    let cards = cards()?;

    // Exact source-title and exact compiler-alias matches are deterministic cache hits.
    for card in cards {
        if normalized_question == card.normalized_title
            || card
                .normalized_aliases
                .iter()
                .any(|alias| alias == &normalized_question)
        {
            return Ok(Some(to_answer(card, 1.0)));
        }
    }

    // Natural free-form questions often preserve the exact grammar topic name. We accept
    // that only for multi-token titles. One-word topics such as "Some", "Any" or "All"
    // stay exact-only to avoid collisions.
    let phrase_matches = cards
        .iter()
        .filter(|card| {
            card.informative_title_tokens >= 2
                && normalized_phrase_present(&normalized_question, &card.normalized_title)
        })
        .collect::<Vec<_>>();

    if phrase_matches.len() == 1 {
        return Ok(Some(to_answer(phrase_matches[0], 0.98)));
    }

    Ok(None)
}

#[cfg(test)]
mod tests {
    use super::{answer_atlas_local, cards, KNOWN_FAIL_CLOSED_GAPS};

    #[test]
    fn embedded_atlas_has_exact_expected_coverage() {
        let cards = cards().expect("embedded atlas should parse and validate");
        assert_eq!(cards.len(), 156);

        let ids = cards
            .iter()
            .map(|card| card.card_id.as_str())
            .collect::<std::collections::HashSet<_>>();
        assert_eq!(ids.len(), 156);
        for gap in KNOWN_FAIL_CLOSED_GAPS {
            assert!(!ids.contains(gap));
        }
    }

    #[test]
    fn exact_compiler_aliases_are_zero_token_hits() {
        let cases = [
            ("Present Perfect Continuous nedir ve nasıl kullanılır?", "A001"),
            ("Mustn't vs Don't have to ne zaman kullanılır?", "A029"),
            (
                "Remember doing vs Remember to do kullanım mantığını yeni başlayan birine anlat.",
                "A114",
            ),
            (
                "At / On / In for place için doğru kullanım nasıl anlaşılır?",
                "A146",
            ),
            ("Cleft Sentences yapısını kısa ama net açıkla.", "A158"),
        ];

        for (question, expected_id) in cases {
            let answer = answer_atlas_local(question)
                .expect("cache lookup should succeed")
                .expect("expected atlas hit");
            assert_eq!(answer.source, "local-atlas-cache");
            assert_eq!(answer.card_id, expected_id);
            assert_eq!(answer.confidence, 1.0);
        }
    }

    #[test]
    fn exact_multiword_topic_inside_natural_question_is_safe_hit() {
        let answer = answer_atlas_local("Aga Past Perfect Continuous mantığını bana anlatır mısın?")
            .expect("cache lookup should succeed")
            .expect("expected atlas hit");
        assert_eq!(answer.card_id, "A004");
        assert!(answer.confidence >= 0.98);
    }

    #[test]
    fn ambiguous_one_word_topics_fail_closed_without_exact_alias() {
        assert!(answer_atlas_local("some any farkı ne?")
            .expect("cache lookup should succeed")
            .is_none());
    }

    #[test]
    fn known_missing_topics_do_not_fabricate_cache_hits() {
        for question in [
            "Narrative Tenses nedir ve nasıl kullanılır?",
            "Past Simple finished-time expressions ne zaman kullanılır?",
            "Indefinite Pronouns yapısını kısa ama net açıkla.",
            "Before vs After için doğru kullanım nasıl anlaşılır?",
        ] {
            assert!(answer_atlas_local(question)
                .expect("cache lookup should succeed")
                .is_none());
        }
    }

    #[test]
    fn unrelated_question_fails_closed() {
        assert!(answer_atlas_local("bana bugün ne çalışmam gerektiğini söyle")
            .expect("cache lookup should succeed")
            .is_none());
    }
}
