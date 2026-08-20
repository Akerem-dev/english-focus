pub use crate::grammar::types::GrammarLocalAnswer;
use crate::grammar::{runtime_cache::answer_local, types::GrammarAnswerResponse};

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
