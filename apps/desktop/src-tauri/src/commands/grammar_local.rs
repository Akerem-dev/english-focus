pub use crate::grammar::types::GrammarLocalAnswer;
use crate::grammar::{
    atlas_cache::answer_atlas_local,
    runtime_cache::answer_local as answer_core_local,
    types::GrammarAnswerResponse,
};

fn answer_local(question: &str) -> Result<Option<GrammarLocalAnswer>, String> {
    if let Some(answer) = answer_core_local(question)? {
        return Ok(Some(answer));
    }

    answer_atlas_local(question)
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
    fn ambiguous_cross_topic_question_still_fails_closed() {
        assert!(answer_local("must ile have to arasında ince anlam farkı nedir?")
            .expect("local lookup should succeed")
            .is_none());
    }
}
