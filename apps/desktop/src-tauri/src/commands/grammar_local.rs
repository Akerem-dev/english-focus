pub use crate::grammar::types::GrammarLocalAnswer;
use crate::grammar::{
    atlas_cache::answer_atlas_local, atlas_review::is_runtime_approved,
    core_curated::answer_curated_core, runtime_cache::answer_local as answer_core_local,
    types::GrammarAnswerResponse,
};

fn answer_local(question: &str) -> Result<Option<GrammarLocalAnswer>, String> {
    if let Some(answer) = answer_curated_core(question)? {
        return Ok(Some(answer));
    }
    if let Some(answer) = answer_core_local(question)? {
        return Ok(Some(answer));
    }

    let Some(answer) = answer_atlas_local(question)? else {
        return Ok(None);
    };
    if !is_runtime_approved(&answer.card_id) {
        return Ok(None);
    }

    Ok(Some(answer))
}

#[tauri::command]
pub fn assistant_answer_grammar_local(
    question: String,
) -> Result<Option<GrammarLocalAnswer>, String> {
    answer_local(&question)
}

#[tauri::command]
pub fn assistant_answer_grammar(question: String) -> Result<GrammarAnswerResponse, String> {
    match answer_local(&question)? {
        Some(answer) => Ok(GrammarAnswerResponse::Local { answer }),
        None => Ok(GrammarAnswerResponse::Miss),
    }
}

#[cfg(test)]
mod tests {
    use super::answer_local;

    const CURATED_CORE_QUESTIONS: &str = include_str!("../grammar/core_curated_aliases.tsv");

    #[test]
    fn every_curated_core_wording_bypasses_cloud() {
        let mut checked = 0usize;

        for raw_line in CURATED_CORE_QUESTIONS.lines() {
            let line = raw_line.trim_start_matches('\u{feff}').trim();
            if line.is_empty() {
                continue;
            }

            let (_, question) = line
                .split_once('\t')
                .expect("curated grammar row should contain a tab separator");
            let answer = answer_local(question)
                .expect("local lookup should succeed")
                .expect("every curated compiler question must be a local hit");

            assert_eq!(answer.source, "local-core-cache", "question={question}");
            checked += 1;
        }

        assert_eq!(checked, 195);
    }

    #[test]
    fn natural_curated_core_wording_can_bypass_cloud() {
        let answer =
            answer_local("aga present perfect mi past simple mı kafam karıştı neye bakıp seçecem")
                .expect("local lookup should succeed")
                .expect("expected curated core hit");
        assert_eq!(answer.source, "local-core-cache");
        assert_eq!(answer.card_id, "C015");
    }

    #[test]
    fn hardened_core_cache_keeps_priority_for_broad_family_questions() {
        let answer = answer_local("present perfect mi past simple mı")
            .expect("local lookup should succeed")
            .expect("expected core hit");
        assert_eq!(answer.source, "local-core-cache");
        assert_eq!(answer.card_id, "C015");
    }

    #[test]
    fn compiled_atlas_answers_specific_topics_after_core_miss() {
        let answer = answer_local("Mustn't vs Don't have to ne zaman kullanılır?")
            .expect("local lookup should succeed")
            .expect("expected atlas hit");
        assert_eq!(answer.source, "local-atlas-cache");
        assert_eq!(answer.card_id, "A029");
    }

    #[test]
    fn manually_approved_atlas_card_remains_zero_token() {
        let answer = answer_local("Remember doing vs Remember to do ne zaman kullanılır?")
            .expect("local lookup should succeed")
            .expect("expected approved atlas hit");
        assert_eq!(answer.source, "local-atlas-cache");
        assert_eq!(answer.card_id, "A114");
    }

    #[test]
    fn semantically_weak_atlas_card_is_quarantined() {
        assert!(answer_local("All nedir ve nasıl kullanılır?")
            .expect("local lookup should succeed")
            .is_none());
        assert!(answer_local("Try doing vs Try to do ne zaman kullanılır?")
            .expect("local lookup should succeed")
            .is_none());
    }

    #[test]
    fn ambiguous_cross_topic_question_still_fails_closed() {
        assert!(
            answer_local("must ile have to arasında ince anlam farkı nedir?")
                .expect("local lookup should succeed")
                .is_none()
        );
    }
}
