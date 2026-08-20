use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GrammarLocalAnswer {
    pub source: &'static str,
    pub card_id: String,
    pub topic_name: String,
    pub category: String,
    pub answer_text: String,
    pub core_rule_ids: Vec<String>,
    pub support_rule_ids: Vec<String>,
    pub confidence: f32,
}

#[tauri::command]
pub fn assistant_answer_grammar_local(question: String) -> Result<Option<GrammarLocalAnswer>, String> {
    crate::grammar::runtime_cache::answer_local(&question)
}
