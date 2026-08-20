pub use crate::grammar::types::GrammarLocalAnswer;
use crate::grammar::{
    atlas_cache::answer_atlas_local, atlas_rescue::answer_reviewed_atlas,
    atlas_review::is_runtime_approved, core_curated::answer_curated_core,
    runtime_cache::answer_local as answer_core_local, types::GrammarAnswerResponse,
};

fn answer_local(question: &str) -> Result<Option<GrammarLocalAnswer>, String> {
    if let Some(answer) = answer_curated_core(question)? {
        return Ok(Some(answer));
    }
    if let Some(answer) = answer_core_local(question)? {
        return Ok(Some(answer));
    }

    if let Some(answer) = answer_atlas_local(question)? {
        if is_runtime_approved(&answer.card_id) {
            return Ok(Some(answer));
        }
    }

    if let Some(answer) = answer_reviewed_atlas(question) {
        return Ok(Some(answer));
    }

    Ok(None)
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
    fn source_reviewed_rescues_cover_safe_compiler_weaknesses() {
        for (question, expected_id) in [
            ("All nedir ve nasıl kullanılır?", "A073"),
            ("Any ne zaman kullanılır?", "A066"),
            ("Adjective Order nedir ve nasıl kullanılır?", "A089"),
            ("The more ... the more ne zaman kullanılır?", "A100"),
            ("Go on doing vs Go on to do ne zaman kullanılır?", "A118"),
            ("So that ne zaman kullanılır?", "A132"),
            ("At / On / In for time ne zaman kullanılır?", "A145"),
        ] {
            let answer = answer_local(question)
                .expect("local lookup should succeed")
                .expect("reviewed rescue should be a local hit");
            assert_eq!(answer.source, "local-reviewed-atlas", "question={question}");
            assert_eq!(answer.card_id, expected_id, "question={question}");
        }
    }

    #[test]
    fn source_reviewed_rescues_recover_three_failed_compiler_cards() {
        for (question, expected_id) in [
            (
                "Past Simple finished-time expressions nedir ve nasıl kullanılır?",
                "A014",
            ),
            ("Indefinite Pronouns ne zaman kullanılır?", "A087"),
            ("Before vs After yapısını kısa ama net açıkla.", "A150"),
        ] {
            let answer = answer_local(question)
                .expect("local lookup should succeed")
                .expect("reviewed missing card should be a local hit");
            assert_eq!(answer.source, "local-reviewed-atlas", "question={question}");
            assert_eq!(answer.card_id, expected_id, "question={question}");
        }
    }

    #[test]
    fn unresolved_weak_atlas_intents_still_fail_closed() {
        for question in [
            "Narrative Tenses nedir ve nasıl kullanılır?",
            "Always with continuous forms nedir ve nasıl kullanılır?",
            "Passive reporting structures nedir ve nasıl kullanılır?",
            "Reported Commands nedir ve nasıl kullanılır?",
            "Try doing vs Try to do ne zaman kullanılır?",
            "Mean doing vs Mean to do ne zaman kullanılır?",
            "So ... that nedir ve nasıl kullanılır?",
            "Basic Word Order nedir ve nasıl kullanılır?",
        ] {
            assert!(
                answer_local(question)
                    .expect("local lookup should succeed")
                    .is_none(),
                "question={question}"
            );
        }
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
