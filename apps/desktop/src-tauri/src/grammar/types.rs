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

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum GrammarAnswerResponse {
    Local { answer: GrammarLocalAnswer },
    Miss,
}
