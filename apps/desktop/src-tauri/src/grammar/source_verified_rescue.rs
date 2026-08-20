use crate::grammar::types::GrammarLocalAnswer;

#[derive(Debug, Clone, Copy)]
struct SourceVerifiedRescue {
    card_id: &'static str,
    title: &'static str,
    category: &'static str,
    answer_text: &'static str,
}

// These eight rescues close the final atlas coverage gaps only after manual source verification.
// The underlying compiler prose remains quarantined where applicable. The replacement text below
// is deliberately narrow: every statement was checked against the local grammar-book corpus
// (Parrott, Murphy, Swan and Collins COBUILD). Because this second audit was performed directly
// against source passages rather than compiler CORELOCK/SUPPORTLOCK rule rows, rule-id arrays are
// intentionally empty instead of pretending that a compiler R-id supports the replacement.
const SOURCE_VERIFIED_RESCUES: &[SourceVerifiedRescue] = &[
    SourceVerifiedRescue {
        card_id: "A010",
        title: "Narrative Tenses",
        category: "Time & Aspect Details",
        answer_text: "Narrative Tenses: Hikâye anlatırken Past Simple genellikle ana zaman çerçevesini kurar ve olayları ileri taşır. Past Continuous, ana olay olurken sürmekte olan arka planı veya o geçmiş noktada devam eden durumu gösterir. Past Perfect ise ana geçmiş referans noktasından daha önce gerçekleşmiş olayları, arka plan bilgisini veya flashback'i belirginleştirir. Olayların sırası bağlamdan ya da before/after gibi ifadelerden zaten açıksa her önceki olay için Past Perfect kullanmak zorunlu değildir; zaman seçimini olayın hikâyedeki işlevine göre yaparsın.",
    },
    SourceVerifiedRescue {
        card_id: "A015",
        title: "Always with continuous forms",
        category: "Time & Aspect Details",
        answer_text: "Always with continuous forms: Always + Simple normal bir alışkanlığı, yani bir şeyin her seferinde olduğunu anlatabilir: I always go... Always/constantly/forever/continually + Continuous ise tekrarlanan davranışı 'fazla sık / normalden daha sık' olarak sunabilir ve özellikle şikâyet, eleştiri veya rahatsızlık tonu taşıyabilir: He's always complaining. Bu yüzden always görünce otomatik olarak Continuous seçilmez; normal rutin için Simple, konuşanın tekrara özel vurgu veya tutum kattığı durumda Continuous daha uygundur.",
    },
    SourceVerifiedRescue {
        card_id: "A047",
        title: "Passive reporting structures",
        category: "Passive & Causative",
        answer_text: "Passive reporting structures: People say/believe/think/report ... gibi genel bir bildirimi pasifleştirmenin iki temel yolu vardır: It is said that + clause ve bildirilen kişiyi özne yaparak subject + is said/believed/thought/reported + to-infinitive. Örneğin People say that he is 108 ile It is said that he is 108 / He is said to be 108 aynı bildirimi farklı odakla verir. Bildirilen eylem daha önce gerçekleşmişse perfect infinitive kullanılabilir: He is alleged to have stolen... Bu yapılar özellikle haber ve resmî raporlama dilinde yaygındır.",
    },
    SourceVerifiedRescue {
        card_id: "A051",
        title: "Reported Commands",
        category: "Reported Speech",
        answer_text: "Reported Commands: Bir emir, rica veya tavsiyeyi dolaylı anlatırken yaygın kalıp reporting verb + kişi/nesne + to-infinitive şeklindedir: He told her to wait; He ordered me to fetch the books; He asked her to help. Tell, ask, order, advise, instruct ve benzeri fiiller bu yapıda kullanılabilir. Olumsuz emir veya rica aktarılırken not, to-infinitive'in önüne gelir: He told me not to go. Yani reported statement'taki that-clause mantığını her emre uygulamak yerine, emir/rica için object + (not) to-infinitive kalıbına bakmak gerekir.",
    },
    SourceVerifiedRescue {
        card_id: "A115",
        title: "Try doing vs Try to do",
        category: "Verb Patterns & Non-finite Forms II",
        answer_text: "Try doing vs Try to do: Try to do çoğunlukla zor veya belirsiz bir işi başarmak için çaba göstermek/attempt etmek anlamındadır: I tried to explain. Try doing ise bir yöntemi deneyip ne olacağını veya işe yarayıp yaramadığını görmek anlamını özellikle açık biçimde verir: Try pressing the green button. Bazı bağlamlarda try + -ing de çaba anlamına yaklaşabildiği için yalnız forma değil bağlama bak; temel karşıtlık 'başarmaya çalışmak' ile 'bir yöntemi deneyip sonucunu görmek'tir.",
    },
    SourceVerifiedRescue {
        card_id: "A117",
        title: "Mean doing vs Mean to do",
        category: "Verb Patterns & Non-finite Forms II",
        answer_text: "Mean doing vs Mean to do: Mean + -ing, 'gerektirmek / sonucunda bunu içermek' anlamındaki mean için kullanılır: Passing the exam will mean studying hard. Mean + to-infinitive ise 'niyet etmek / planlamak' anlamındadır: I didn't mean to interrupt you. Kısaca mean doing = involve/have as a result; mean to do = intend/plan. Bu iki yapı arasındaki seçim doğrudan mean fiilinin cümledeki anlamına bağlıdır.",
    },
    SourceVerifiedRescue {
        card_id: "A134",
        title: "So ... that",
        category: "Subordinate Clauses & Linking",
        answer_text: "So ... that: Bu yapı bir dereceyi ve onun sonucunu bağlar. Temel kalıp so + adjective/adverb + (that) + result clause şeklindedir: It was so cold that we stopped playing; He spoke so fast that nobody could understand. That konuşmada bazen düşebilir. Noun phrase ile sonuç kurarken genellikle such + noun phrase + (that) kullanılır. Purpose anlatan so that ise ayrı bir yapıdır; so ... that burada 'o kadar ... ki, sonuç olarak ...' anlamını kurar.",
    },
    SourceVerifiedRescue {
        card_id: "A156",
        title: "Basic Word Order",
        category: "Word Order, Emphasis & Advanced Grammar",
        answer_text: "Basic Word Order: İngilizcede olumlu düz cümlenin temel sırası Subject + Verb + (Complement/Object) şeklindedir: Anna smiled; Sam is a doctor; The boss bought a car. Nesne alan bir fiilde subject fiilden, object ise normalde fiilden sonra gelir. Sorularda çoğu kez auxiliary + subject + main verb düzeni kullanılır; olumsuzlarda not yardımcı fiilden sonra gelir. Emirlerde özne genellikle söylenmez ve fiil başta görünür. Vurgu, inversion ve konuşma dili gibi özel yapılar bu temel sıradan ayrılabilir, ama başlangıç kuralı S-V-(C/O)'dur.",
    },
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

fn generated_aliases(title: &str) -> [String; 8] {
    [
        format!("{title} nedir ve nasıl kullanılır?"),
        format!("{title} ne zaman kullanılır?"),
        format!("{title} için temel grammar kuralını Türkçe açıkla."),
        format!("{title} kullanım mantığını yeni başlayan birine anlat."),
        format!("{title} yapısını kısa ama net açıkla."),
        format!("{title} İngilizcede hangi durumda kullanılır?"),
        format!("{title} için doğru kullanım nasıl anlaşılır?"),
        format!("{title} konusunda temel kural ve dikkat edilmesi gereken nokta nedir?"),
    ]
}

fn to_answer(card: &SourceVerifiedRescue) -> GrammarLocalAnswer {
    GrammarLocalAnswer {
        source: "local-reviewed-atlas",
        card_id: card.card_id.to_string(),
        topic_name: card.title.to_string(),
        category: card.category.to_string(),
        answer_text: card.answer_text.to_string(),
        core_rule_ids: Vec::new(),
        support_rule_ids: Vec::new(),
        confidence: 1.0,
    }
}

pub fn answer_source_verified_atlas(question: &str) -> Option<GrammarLocalAnswer> {
    let normalized_question = normalize(question.trim());
    if normalized_question.is_empty() {
        return None;
    }

    SOURCE_VERIFIED_RESCUES.iter().find_map(|card| {
        let exact_title = normalize(card.title) == normalized_question;
        let exact_alias = generated_aliases(card.title)
            .iter()
            .any(|alias| normalize(alias) == normalized_question);
        (exact_title || exact_alias).then(|| to_answer(card))
    })
}

#[cfg(test)]
mod tests {
    use super::{answer_source_verified_atlas, generated_aliases, SOURCE_VERIFIED_RESCUES};

    #[test]
    fn all_final_gap_aliases_are_source_verified_zero_token_hits() {
        assert_eq!(SOURCE_VERIFIED_RESCUES.len(), 8);

        for card in SOURCE_VERIFIED_RESCUES {
            for alias in generated_aliases(card.title) {
                let answer = answer_source_verified_atlas(&alias)
                    .expect("source-verified alias should resolve");
                assert_eq!(answer.card_id, card.card_id, "alias={alias}");
                assert_eq!(answer.source, "local-reviewed-atlas");
                assert_eq!(answer.confidence, 1.0);
                assert!(answer.core_rule_ids.is_empty());
                assert!(answer.support_rule_ids.is_empty());
            }
        }
    }

    #[test]
    fn unrelated_questions_stay_closed() {
        assert!(answer_source_verified_atlas("must ile have to arasında ince fark ne?").is_none());
    }
}
