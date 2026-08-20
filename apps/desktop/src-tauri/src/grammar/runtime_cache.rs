use std::cmp::Ordering;

use crate::commands::grammar_local::GrammarLocalAnswer;

#[derive(Debug)]
struct CoreTopic {
    topic_name: &'static str,
    category: &'static str,
    canonical_card_id: &'static str,
    answer_text: &'static str,
    aliases: &'static [&'static str],
}

const CORE_TOPICS: &[CoreTopic] = &[
    CoreTopic {
        topic_name: "Present Perfect vs Past Simple",
        category: "Tenses & Time",
        canonical_card_id: "C015",
        answer_text: "Present Perfect: Geçmiş ile şimdiki zamanı bir bütün olarak değerlendirdiğiniz durumlarda Present Perfect kullanılır. Şimdiki anı da kapsayan zaman dilimlerinden bahsederken bu yapı tercih edilir.\nPast Simple: Geçmişte yaşanmış, tamamlanmış ve şimdiki zamanla bağı kopmuş olaylar için Past Simple kullanılır. Eğer bir zaman dilimini tamamen geçmiş ve bitmiş bir süreç olarak görüyorsanız bu yapıyı tercih etmelisiniz.",
        aliases: &["present perfect past simple", "present perfect mi past simple mı", "present perfect ile past simple arasındaki fark"],
    },
    CoreTopic {
        topic_name: "for vs since",
        category: "Tenses & Time",
        canonical_card_id: "C030",
        answer_text: "for: Bir eylemin veya durumun ne kadar süredir devam ettiğini belirten süre için kullanılır.\nsince: Bir eylemin veya durumun başladığı başlangıç noktasını belirtir ve çoğunlukla başlangıçtan şimdiye uzanan süreci anlatır.",
        aliases: &["for vs since", "for mu since mı", "for ve since arasındaki fark"],
    },
    CoreTopic {
        topic_name: "a/an/the",
        category: "Nouns & Articles",
        canonical_card_id: "C045",
        answer_text: "a/an: Bir kişi veya nesneden ilk defa ya da belirsiz biçimde bahsederken kullanılır.\nthe: Dinleyicinin veya okuyucunun hangi belirli kişi ya da nesneden söz edildiğini bildiği veya kolayca belirleyebildiği durumlarda kullanılır.",
        aliases: &["a an the", "a an the farkı", "a an mı the mı"],
    },
    CoreTopic {
        topic_name: "Conditionals",
        category: "Clauses & Conditionals",
        canonical_card_id: "C060",
        answer_text: "Zero conditional genel doğrular içindir: if + present, present. First conditional gerçekçi/olası gelecek için: if + present, will + infinitive. Second conditional hayali veya düşük olasılıklı durumlar için: if + past, would + infinitive. Third conditional geçmişte gerçekleşmemiş durumlar için: if + past perfect, would have + past participle.",
        aliases: &["conditionals", "zero first second third conditional", "0 1 2 3 conditional"],
    },
    CoreTopic {
        topic_name: "Active vs Passive",
        category: "Modals & Verb Patterns",
        canonical_card_id: "C075",
        answer_text: "Active voice, eylemi yapanı odağa alır. Passive voice ise eylemden etkilenen kişi veya şeyi özne konumuna getirir; yapan bilinmiyorsa, önemsizse veya özellikle vurgulanmak istenmiyorsa sık kullanılır.",
        aliases: &["active vs passive", "active passive", "active voice passive voice"],
    },
    CoreTopic {
        topic_name: "Modals",
        category: "Modals & Verb Patterns",
        canonical_card_id: "C090",
        answer_text: "can çoğunlukla yetenek ve izin; could geçmiş yetenek, nazik istek ve olasılık; may izin ve olasılık; might daha ihtiyatlı/düşük olasılık; must ise güçlü zorunluluk, gereklilik veya bağlama göre güçlü çıkarım anlatır. Seçimde önce cümlenin anlam işlevine bak.",
        aliases: &["modals", "can could may might must", "can could may might must farkı"],
    },
    CoreTopic {
        topic_name: "Present Simple vs Continuous",
        category: "Tenses & Time",
        canonical_card_id: "C105",
        answer_text: "Present Simple genel doğrular, alışkanlıklar, rutinler ve kalıcı/genel durumlar için kullanılır. Present Continuous ise konuşma anında veya bu dönem çevresinde devam eden geçici eylem ve durumlara odaklanır; ayrıca önceden düzenlenmiş bazı gelecek planlarında da kullanılabilir.",
        aliases: &["present simple vs continuous", "present simple present continuous", "present simple mı continuous mı"],
    },
    CoreTopic {
        topic_name: "Future forms",
        category: "Tenses & Time",
        canonical_card_id: "C120",
        answer_text: "will genellikle anlık kararlar, genel tahminler ve gelecek görüşleri için; be going to önceden oluşmuş niyetler ve mevcut kanıta dayalı tahminler için; Present Continuous ise önceden düzenlenmiş somut planlar için kullanılır.",
        aliases: &["future forms", "will going to present continuous", "will mi going to mu"],
    },
    CoreTopic {
        topic_name: "Countable vs Uncountable",
        category: "Nouns & Articles",
        canonical_card_id: "C135",
        answer_text: "Countable nouns tekil veya çoğul olabilir ve sayılarla kullanılabilir. Uncountable nouns genellikle sayı ile doğrudan kullanılmaz, çoğul ek almaz ve tekil dilbilgisel davranış gösterir. İngilizcede bu ayrım her zaman gerçek dünyadaki sayılabilirliğe birebir uymaz; sözlük kontrolü güvenilir bir yöntemdir.",
        aliases: &["countable vs uncountable", "countable uncountable", "sayılabilen sayılamayan isimler"],
    },
    CoreTopic {
        topic_name: "Comparative vs Superlative",
        category: "Adjectives & Adverbs",
        canonical_card_id: "C150",
        answer_text: "Comparative iki kişi/şey veya iki durum arasında karşılaştırma yapar ve sıkça than ile kullanılır. Superlative ise bir kişi ya da şeyin ait olduğu grup içinde en yüksek veya en düşük dereceyi ifade eder.",
        aliases: &["comparative vs superlative", "comparative superlative", "karşılaştırma üstünlük"],
    },
    CoreTopic {
        topic_name: "Relative clauses",
        category: "Clauses & Conditionals",
        canonical_card_id: "C165",
        answer_text: "Defining relative clause, hangi kişi veya şeyden söz edildiğini belirlemek için gerekli bilgiyi verir. Non-defining relative clause ise zaten belirli olan kişi veya şey hakkında ek bilgi verir; virgülle ayrılır ve bu yapıda that kullanılmaz.",
        aliases: &["relative clauses", "defining non defining relative clause", "relative clause"],
    },
    CoreTopic {
        topic_name: "Gerund vs Infinitive",
        category: "Modals & Verb Patterns",
        canonical_card_id: "C180",
        answer_text: "Birçok fiil ardından -ing yapısı alırken bazı fiiller to-infinitive alır. Seçim büyük ölçüde önceki fiilin kalıbına bağlıdır; tek bir evrensel kısayol yoktur. Bu yüzden fiili, aldığı tamamlayıcıyla birlikte öğrenmek ve gerektiğinde iyi bir sözlükten kontrol etmek en güvenilir yöntemdir.",
        aliases: &["gerund vs infinitive", "gerund infinitive", "ing mi to mu", "verbden sonra ing mi to mu"],
    },
    CoreTopic {
        topic_name: "Used-to family",
        category: "Modals & Verb Patterns",
        canonical_card_id: "C195",
        answer_text: "used to geçmişte düzenli olan fakat artık geçerli olmayan alışkanlık veya durumları anlatır ve ardından yalın fiil gelir. be used to bir şeye alışkın olma durumudur. get used to ise bir şeye zamanla alışma sürecini anlatır; be/get used to sonrasında isim veya -ing yapı gelebilir.",
        aliases: &["used to be used to get used to", "used to family", "used tolar", "be used to get used to farkı"],
    },
];

const STOPWORDS: &[&str] = &[
    "a", "an", "the", "ve", "ile", "mi", "mı", "mu", "mü", "ne", "nedir", "nasıl",
    "hangi", "hangisi", "zaman", "kullanılır", "kullanırım", "anlat", "açıkla", "fark",
    "farkı", "farkları", "için", "bir", "bu", "şu", "da", "de", "grammar", "türkçe",
    "kısa", "what", "when", "how", "use", "usage", "difference", "explain", "rule",
];

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

fn informative_tokens(value: &str) -> Vec<String> {
    let mut tokens = normalize(value)
        .split_whitespace()
        .filter(|token| !STOPWORDS.contains(token))
        .filter(|token| token.chars().count() > 1)
        .map(str::to_string)
        .collect::<Vec<_>>();
    tokens.sort();
    tokens.dedup();
    tokens
}

fn overlap_score(question: &str, alias: &str) -> (f32, usize) {
    let question_tokens = informative_tokens(question);
    let alias_tokens = informative_tokens(alias);
    if question_tokens.is_empty() || alias_tokens.is_empty() {
        return (0.0, 0);
    }

    let overlap = question_tokens
        .iter()
        .filter(|token| alias_tokens.contains(token))
        .count();
    if overlap == 0 {
        return (0.0, 0);
    }

    let query_coverage = overlap as f32 / question_tokens.len() as f32;
    let alias_coverage = overlap as f32 / alias_tokens.len() as f32;
    ((query_coverage * 0.68) + (alias_coverage * 0.32), overlap)
}

fn to_answer(topic: &CoreTopic, confidence: f32) -> GrammarLocalAnswer {
    GrammarLocalAnswer {
        source: "local-core-cache",
        card_id: topic.canonical_card_id.to_string(),
        topic_name: topic.topic_name.to_string(),
        category: topic.category.to_string(),
        answer_text: topic.answer_text.to_string(),
        core_rule_ids: Vec::new(),
        support_rule_ids: Vec::new(),
        confidence,
    }
}

pub fn answer_local(question: &str) -> Result<Option<GrammarLocalAnswer>, String> {
    let question = question.trim();
    if question.is_empty() {
        return Ok(None);
    }

    let normalized_question = normalize(question);
    for topic in CORE_TOPICS {
        if normalize(topic.topic_name) == normalized_question
            || topic.aliases.iter().any(|alias| normalize(alias) == normalized_question)
        {
            return Ok(Some(to_answer(topic, 1.0)));
        }
    }

    let mut ranked = CORE_TOPICS
        .iter()
        .map(|topic| {
            let mut best_score = overlap_score(question, topic.topic_name);
            for alias in topic.aliases {
                let candidate = overlap_score(question, alias);
                if candidate.0 > best_score.0 {
                    best_score = candidate;
                }
            }
            (topic, best_score.0, best_score.1)
        })
        .collect::<Vec<_>>();

    ranked.sort_by(|left, right| right.1.partial_cmp(&left.1).unwrap_or(Ordering::Equal));

    let Some((best_topic, best_score, best_overlap)) = ranked.first().copied() else {
        return Ok(None);
    };
    let second_score = ranked.get(1).map_or(0.0, |candidate| candidate.1);
    let margin = best_score - second_score;

    if best_overlap >= 2 && best_score >= 0.86 && margin >= 0.16 {
        return Ok(Some(to_answer(best_topic, best_score)));
    }

    Ok(None)
}

#[cfg(test)]
mod tests {
    use super::answer_local;

    #[test]
    fn known_core_question_is_zero_token_hit() {
        let answer = answer_local("present perfect mi past simple mı")
            .unwrap()
            .expect("expected local grammar hit");
        assert_eq!(answer.source, "local-core-cache");
        assert_eq!(answer.topic_name, "Present Perfect vs Past Simple");
    }

    #[test]
    fn gerund_short_form_is_zero_token_hit() {
        let answer = answer_local("verbden sonra ing mi to mu")
            .unwrap()
            .expect("expected local grammar hit");
        assert_eq!(answer.topic_name, "Gerund vs Infinitive");
    }

    #[test]
    fn uncertain_cross_topic_question_fails_closed() {
        assert!(answer_local("must ile have to arasında ince anlam farkı nedir?")
            .unwrap()
            .is_none());
    }

    #[test]
    fn unrelated_question_fails_closed() {
        assert!(answer_local("bugün hava güzel bana rastgele bir şey anlat")
            .unwrap()
            .is_none());
    }
}
