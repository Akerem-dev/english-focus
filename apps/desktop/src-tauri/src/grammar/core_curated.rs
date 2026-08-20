use std::collections::HashMap;
use std::sync::OnceLock;

use crate::grammar::runtime_cache::answer_local as answer_core_local;
use crate::grammar::types::GrammarLocalAnswer;

const CURATED_TSV: &str = include_str!("core_curated_aliases.tsv");
const CORE_FAMILY_COUNT: usize = 13;
const EXPECTED_CURATED_ALIAS_COUNT: usize = 195;

const CANONICAL_CORE_QUESTIONS: [&str; CORE_FAMILY_COUNT] = [
    "Present Perfect vs Past Simple",
    "for vs since",
    "a/an/the",
    "Conditionals",
    "Active vs Passive",
    "Modals",
    "Present Simple vs Continuous",
    "Future forms",
    "Countable vs Uncountable",
    "Comparative vs Superlative",
    "Relative clauses",
    "Gerund vs Infinitive",
    "Used-to family",
];

static CURATED_ALIASES: OnceLock<Result<HashMap<String, usize>, String>> = OnceLock::new();

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

fn parse_aliases() -> Result<HashMap<String, usize>, String> {
    let mut aliases = HashMap::with_capacity(EXPECTED_CURATED_ALIAS_COUNT);
    let mut row_count = 0usize;

    for (line_number, line) in CURATED_TSV.lines().enumerate() {
        let line = line.trim_start_matches('\u{feff}').trim();
        if line.is_empty() {
            continue;
        }

        let (family_raw, question) = line.split_once('\t').ok_or_else(|| {
            format!("grammar_core_alias_invalid|line={}", line_number + 1)
        })?;
        let family = family_raw.parse::<usize>().map_err(|_| {
            format!(
                "grammar_core_alias_family_invalid|line={}|value={family_raw}",
                line_number + 1
            )
        })?;
        if family >= CORE_FAMILY_COUNT {
            return Err(format!(
                "grammar_core_alias_family_out_of_range|line={}|value={family}",
                line_number + 1
            ));
        }

        let normalized = normalize(question);
        if normalized.is_empty() {
            return Err(format!(
                "grammar_core_alias_empty|line={}",
                line_number + 1
            ));
        }

        if let Some(existing) = aliases.insert(normalized, family) {
            if existing != family {
                return Err(format!(
                    "grammar_core_alias_collision|line={}|families={existing},{family}",
                    line_number + 1
                ));
            }
        }
        row_count += 1;
    }

    if row_count != EXPECTED_CURATED_ALIAS_COUNT {
        return Err(format!(
            "grammar_core_alias_count_mismatch|expected={EXPECTED_CURATED_ALIAS_COUNT}|actual={row_count}"
        ));
    }

    Ok(aliases)
}

fn aliases() -> Result<&'static HashMap<String, usize>, String> {
    match CURATED_ALIASES.get_or_init(parse_aliases) {
        Ok(aliases) => Ok(aliases),
        Err(error) => Err(error.clone()),
    }
}

pub fn answer_curated_core(question: &str) -> Result<Option<GrammarLocalAnswer>, String> {
    let normalized = normalize(question.trim());
    if normalized.is_empty() {
        return Ok(None);
    }

    let Some(family) = aliases()?.get(&normalized).copied() else {
        return Ok(None);
    };

    let answer = answer_core_local(CANONICAL_CORE_QUESTIONS[family])?.ok_or_else(|| {
        format!("grammar_core_canonical_missing|family={family}")
    })?;
    Ok(Some(answer))
}

#[cfg(test)]
mod tests {
    use super::{aliases, answer_curated_core, EXPECTED_CURATED_ALIAS_COUNT};

    #[test]
    fn imports_all_195_compiler_curated_questions() {
        assert_eq!(
            aliases().expect("curated aliases should parse").len(),
            EXPECTED_CURATED_ALIAS_COUNT
        );
    }

    #[test]
    fn turkish_natural_core_question_is_zero_token_hit() {
        let answer = answer_curated_core(
            "aga present perfect mi past simple mı kafam karıştı neye bakıp seçecem",
        )
        .expect("curated lookup should succeed")
        .expect("expected curated hit");
        assert_eq!(answer.source, "local-core-cache");
        assert_eq!(answer.card_id, "C015");
    }

    #[test]
    fn unrelated_question_does_not_match_curated_inventory() {
        assert!(answer_curated_core("bugün hava nasıl")
            .expect("curated lookup should succeed")
            .is_none());
    }
}
