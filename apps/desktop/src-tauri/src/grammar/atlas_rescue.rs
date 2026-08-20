use crate::grammar::types::GrammarLocalAnswer;

#[derive(Debug, Clone, Copy)]
struct ReviewedAtlasRescue {
    card_id: &'static str,
    title: &'static str,
    category: &'static str,
    answer_text: &'static str,
    core_rule_ids: &'static [&'static str],
    support_rule_ids: &'static [&'static str],
}

// These answers are intentionally hand-reviewed against the local compiler evidence bundle.
// They serve two cases:
// 1) a compiled card whose generated Turkish prose was quarantined even though its retrieved
//    evidence is strong enough for a deterministic replacement;
// 2) an atlas intent whose cloud synthesis never produced an accepted card, while local
//    CORELOCK/SUPPORTLOCK evidence is sufficient to answer safely without Gemini.
//
// Do not add a card here from general grammar knowledge alone. Every statement must be supported
// by the frozen local evidence captured by the MEGA V2 compiler run.
const REVIEWED_RESCUES: &[ReviewedAtlasRescue] = &[
    ReviewedAtlasRescue {
        card_id: "A014",
        title: "Past Simple finished-time expressions",
        category: "Time & Aspect Details",
        answer_text: "Past Simple finished-time expressions: Past Simple, geçmişte tamamen bitmiş bir zaman dilimindeki olayları anlatmak için kullanılır. Yesterday, last week, three years ago ve in 1970 gibi ifadeler zamanı bütünüyle geçmişe yerleştirir; bu yüzden bunlarla Past Simple doğal seçimdir ve Present Perfect genellikle kullanılmaz. This morning gibi bir ifade ise konuşma anına göre değişebilir: sabah bitmiş bir dönem olarak görülüyorsa Past Simple, hâlâ içinde bulunulan zaman diliminin parçası olarak görülüyorsa Present Perfect kullanılabilir. Hikâye anlatımında Past Simple ayrıca olayların temel geçmiş zaman çerçevesini kuran bir ‘time anchor’ görevi görür.",
        core_rule_ids: &["R1"],
        support_rule_ids: &["R17", "R2", "R11", "R13", "R15"],
    },
    ReviewedAtlasRescue {
        card_id: "A058",
        title: "Generic reference with articles",
        category: "Articles & Determiners",
        answer_text: "Generic reference with articles: Genel bir sınıftan veya kavramdan söz ederken çoğul sayılabilir ve sayılamayan isimlerle çoğu zaman zero article, yani artikel kullanmama, tercih edilir. The ise dinleyenin veya okuyucunun hangi kişi ya da şeylerden söz edildiğini belirleyebildiği durumda kullanılır. Bu alanda her kullanım tek bir mekanik kurala indirgenemez; bazı genel fikirler bağlama göre hem the ile hem de zero article ile ifade edilebilir. Bu yüzden önce ‘genel bir sınıf mı anlatıyorum, yoksa bağlamda belirli ve tanınabilir bir grubu mu?’ sorusuna bakmak en güvenli başlangıçtır.",
        core_rule_ids: &["R2"],
        support_rule_ids: &["R1", "R2", "R3"],
    },
    ReviewedAtlasRescue {
        card_id: "A063",
        title: "This and That",
        category: "Articles & Determiners",
        answer_text: "This and That: This konuşana yakın olan kişi veya şeyi, that ise daha uzakta olan ya da o anda yakınında bulunmayan kişi veya şeyi işaret etmek için kullanılır. İkisi de bir isimden önce determiner olarak gelebilir; tek başına pronoun olarak kullanıldıklarında ise normalde şeylere gönderme yaparlar. This ve that daha önce sözü edilen bir şeye geri dönmek için de kullanılabilir. Kısacası temel karşıtlık ‘yakınlık / uzaklık’tır; informal dilde görülen this/that = so kullanımı bunun ayrı bir yan kullanımıdır.",
        core_rule_ids: &["R2"],
        support_rule_ids: &["R7", "R8", "R10", "R14", "R18", "R19"],
    },
    ReviewedAtlasRescue {
        card_id: "A066",
        title: "Any",
        category: "Quantifiers I",
        answer_text: "Any: Any en sık sorularda, olumsuz anlamlı yapılarda ve if-clause’larda belirsiz bir miktar veya sayıdan söz ederken kullanılır: Is there any more coffee? / We didn't have any problems / If you find any blackberries... Ancak any yalnızca ‘olumsuz cümle kelimesi’ değildir. Olumlu yapılarda da ‘hangisi olursa olsun / fark etmez hangisi’ anlamındaki açık seçimi vurgulayabilir: any mistakes gibi. Genel başlangıç kuralı some’ın olumlu cümlelerde, any’nin soru ve olumsuzlarda sık görülmesidir; fakat anlam ve bağlam bu basit dağılımın önüne geçebilir.",
        core_rule_ids: &["R1"],
        support_rule_ids: &["R2", "R3", "R4", "R5", "R9", "R10", "R12", "R15", "R16", "R17", "R18"],
    },
    ReviewedAtlasRescue {
        card_id: "A073",
        title: "All",
        category: "Quantifiers II & Determiners",
        answer_text: "All: All bir grubun toplamını veya bir şeyin toplam miktarını anlatır. En yaygın olarak çoğul sayılabilir ve sayılamayan isim gruplarıyla kullanılır: all children, all the water, all my friends. All + noun ve all of + determiner/pronoun yapıları mümkündür; bazı yapılarda all isimden sonra da yer alabilir. Every ile karşılaştırırken temel biçim farkı şudur: every + singular noun, all + plural noun. All yalnızca ‘çoğul isimle kullanılan bir kelime’ değildir; sayılamayan isimlerle ve bazı özel tekil yapılarda da kullanılabilir.",
        core_rule_ids: &["R3"],
        support_rule_ids: &["R1", "R2", "R4", "R5", "R6", "R9", "R11", "R12", "R14", "R16", "R19"],
    },
    ReviewedAtlasRescue {
        card_id: "A074",
        title: "Every",
        category: "Quantifiers II & Determiners",
        answer_text: "Every: Every, bir grubun üyelerinin tamamını tek tek kapsayan genel bir ifade kurar ve ardından tekil isim gelir: every child, every country. All benzer bir toplam anlam verebilir ama normal biçim farkı every + singular noun, all + plural noun şeklindedir. Every doğrudan article, possessive veya demonstrative gibi başka bir determiner ile normalde kullanılmaz; bu tür yapılarda all (of) mümkündür. Every ayrıca sıklık bildirmek için kullanılır: every day, every ten minutes. Each bireyleri tek tek düşünmeye daha yatkınken, every grubu bir bütün olarak genelleştirir.",
        core_rule_ids: &["R3"],
        support_rule_ids: &["R1", "R2", "R3", "R6", "R7", "R9", "R10", "R12", "R13", "R15"],
    },
    ReviewedAtlasRescue {
        card_id: "A087",
        title: "Indefinite Pronouns",
        category: "Nouns & Pronouns",
        answer_text: "Indefinite Pronouns: Indefinite pronouns, tam olarak hangi kişi veya şeyden söz edildiğini belirtmeden gönderme yapar. Somebody/someone/something, anybody/anyone/anything, everybody/everyone/everything ve nobody/no one/nothing bu grubun tipik üyeleridir. Bu zamirlerden biri cümlenin öznesiyse ana fiil tekil biçimde kullanılır; daha sonra aynı kişiye geri gönderme yapılırken çoğul they/their türü pronoun ve possessive biçimleri kullanılabilir. Some- biçimleri olumlu ve olumlu cevap beklenen teklif/sorularda sık görülürken, any- biçimleri sorularda, olumsuz anlamlı yapılarda ve daha geniş belirsizlik bağlamlarında yaygındır. No one iki kelime yazılır.",
        core_rule_ids: &["R1"],
        support_rule_ids: &["R2", "R3", "R4", "R6", "R9"],
    },
    ReviewedAtlasRescue {
        card_id: "A089",
        title: "Adjective Order",
        category: "Adjectives & Adverbs",
        answer_text: "Adjective Order: Bir isimden önce birden fazla sıfat geldiğinde İngilizce bunları tamamen rastgele dizmez; sıfatlar çoğu zaman daha veya az sabit bir sırayı izler. Kaynak örneklerinde opinion türü bir sıfatın daha betimleyici bir sıfattan önce gelmesi, age sıfatının nationality sıfatından önce gelmesi gösterilir. Bir noun başka bir noun’u modifier olarak niteliyorsa sıfatlar bu noun grubunun önüne gelir. Sıra mutlak değildir ve vurgu bazı tercihleri değiştirebilir, fakat ‘her sıralama eşit derecede doğal’ da değildir.",
        core_rule_ids: &["R1"],
        support_rule_ids: &["R2", "R3", "R4", "R5", "R10", "R12"],
    },
    ReviewedAtlasRescue {
        card_id: "A100",
        title: "The more ... the more",
        category: "Comparison",
        answer_text: "The more ... the more: Bu yapı iki değişimin birlikte ilerlediğini ya da birinin diğerine bağlı olduğunu anlatır. Kalıp yalnız more kelimesine bağlı değildir; iki tarafta da comparative yapı kullanılır: The sooner we leave, the earlier we'll arrive. Mantık ‘X ne kadar değişirse Y de o kadar değişir’ şeklindedir. Bu nedenle yapı, sıradan superlative kullanımındaki the most kuralıyla karıştırılmamalıdır; burada tekrarlanan the + comparative parçaları birbirine bağlı değişimi kurar.",
        core_rule_ids: &["R1"],
        support_rule_ids: &["R8", "R20"],
    },
    ReviewedAtlasRescue {
        card_id: "A118",
        title: "Go on doing vs Go on to do",
        category: "Verb Patterns & Non-finite Forms II",
        answer_text: "Go on doing vs Go on to do: Go on doing, aynı eylemi yapmaya devam etmek demektir: The president paused and then went on talking. Go on to do ise önceki eylem veya konudan sonra yeni bir eyleme/konuya geçmek demektir: After discussing the economy, the president went on to talk about foreign policy. Yani -ing tarafı ‘aynı şeye devam’, to-infinitive tarafı ‘sonraki yeni şeye geçiş’ karşıtlığını kurar.",
        core_rule_ids: &["R1"],
        support_rule_ids: &["R2", "R3"],
    },
    ReviewedAtlasRescue {
        card_id: "A132",
        title: "So that",
        category: "Subordinate Clauses & Linking",
        answer_text: "So that: So that bir eylemin amacını, yani kişinin o eylemi hangi sonucu elde etmek niyetiyle yaptığını anlatan purpose clause kurar. Özellikle can/could ve will/would gibi modal yapılarla sık görülür: She's learning English so that she can study in Canada. In order that ile aynı amaç alanında kullanılabilir; so that daha yaygın ve daha az resmîdir. Ana cümle ile amaç clause’unun öznesi farklı olduğunda da so that / in order that yapısı kullanışlıdır. Purpose anlamındaki so that ile sonuç anlatan ayrı so ... that yapısını birbirine karıştırmamak gerekir.",
        core_rule_ids: &["R2"],
        support_rule_ids: &["R1", "R2", "R3", "R5", "R6", "R8", "R9", "R10"],
    },
    ReviewedAtlasRescue {
        card_id: "A145",
        title: "At / On / In for time",
        category: "Prepositions",
        answer_text: "At / On / In for time: Zaman ifadelerinde temel dağılımı örneklerden şöyle okuyabiliriz: at kesin saatlerle kullanılır (at 3.30); on günler, belirli günler ve tarihlerle kullanılır (on Monday, on my birthday, on June 21st); in ise aylar, yıllar/yüzyıllar, mevsimler ve günün bölümleriyle kullanılır (in July, in 1985, in autumn, in the morning). In ayrıca gelecekte ‘ne kadar süre sonra’ anlamı da verebilir. Bunlar güçlü temel kalıplardır; sabit ifadeler ve özel kullanımlar ayrıca öğrenilebilir.",
        core_rule_ids: &["R1"],
        support_rule_ids: &["R2", "R11", "R12", "X1"],
    },
    ReviewedAtlasRescue {
        card_id: "A150",
        title: "Before vs After",
        category: "Prepositions",
        answer_text: "Before vs After: Before bir olayın başka bir olaydan daha önce, after ise daha sonra gerçekleştiğini gösterir. I put on my coat before I went out örneğinde paltoyu giyme olayı önce gelir; After it got dark, we came back inside örneğinde geri dönme olayı havanın kararmasından sonra gelir. Future meaning taşıyan before-clause içinde normalde present veya present perfect kullanılır, future tense doğrudan kurulmaz. After ile past perfect kullanmak da ilk eylemin ikinci başlamadan önce ayrı ve tamamlanmış olduğunu özellikle vurgulayabilir.",
        core_rule_ids: &["R1"],
        support_rule_ids: &["R4", "R5", "R6", "R7"],
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

fn informative_title_token_count(title: &str) -> usize {
    const TITLE_STOPWORDS: &[&str] =
        &["a", "an", "the", "and", "or", "vs", "to", "of", "in", "for"];

    normalize(title)
        .split_whitespace()
        .filter(|token| !TITLE_STOPWORDS.contains(token))
        .count()
}

fn to_answer(card: &ReviewedAtlasRescue, confidence: f32) -> GrammarLocalAnswer {
    GrammarLocalAnswer {
        source: "local-reviewed-atlas",
        card_id: card.card_id.to_string(),
        topic_name: card.title.to_string(),
        category: card.category.to_string(),
        answer_text: card.answer_text.to_string(),
        core_rule_ids: card
            .core_rule_ids
            .iter()
            .map(|value| (*value).to_string())
            .collect(),
        support_rule_ids: card
            .support_rule_ids
            .iter()
            .map(|value| (*value).to_string())
            .collect(),
        confidence,
    }
}

pub fn answer_reviewed_atlas(question: &str) -> Option<GrammarLocalAnswer> {
    let normalized_question = normalize(question.trim());
    if normalized_question.is_empty() {
        return None;
    }

    for card in REVIEWED_RESCUES {
        let normalized_title = normalize(card.title);
        if normalized_question == normalized_title
            || generated_aliases(card.title)
                .iter()
                .any(|alias| normalize(alias) == normalized_question)
        {
            return Some(to_answer(card, 1.0));
        }
    }

    let mut phrase_matches = REVIEWED_RESCUES
        .iter()
        .filter(|card| informative_title_token_count(card.title) >= 2)
        .filter_map(|card| {
            let title = normalize(card.title);
            normalized_phrase_present(&normalized_question, &title).then_some((card, title.len()))
        })
        .collect::<Vec<_>>();

    phrase_matches.sort_by(|(left, left_len), (right, right_len)| {
        informative_title_token_count(right.title)
            .cmp(&informative_title_token_count(left.title))
            .then_with(|| right_len.cmp(left_len))
    });

    if let Some((best, best_len)) = phrase_matches.first() {
        let tied_for_specificity = phrase_matches.get(1).is_some_and(|(second, second_len)| {
            informative_title_token_count(second.title) == informative_title_token_count(best.title)
                && second_len == best_len
        });
        if !tied_for_specificity {
            return Some(to_answer(best, 0.98));
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::{answer_reviewed_atlas, generated_aliases, REVIEWED_RESCUES};

    #[test]
    fn all_reviewed_rescue_aliases_are_zero_token_hits() {
        assert_eq!(REVIEWED_RESCUES.len(), 13);

        for card in REVIEWED_RESCUES {
            for alias in generated_aliases(card.title) {
                let answer = answer_reviewed_atlas(&alias).expect("reviewed alias should resolve");
                assert_eq!(answer.card_id, card.card_id, "alias={alias}");
                assert_eq!(answer.source, "local-reviewed-atlas");
                assert_eq!(answer.confidence, 1.0);
            }
        }
    }

    #[test]
    fn reviewed_missing_compiler_cards_are_available_locally() {
        for (question, card_id) in [
            (
                "Past Simple finished-time expressions nedir ve nasıl kullanılır?",
                "A014",
            ),
            ("Indefinite Pronouns ne zaman kullanılır?", "A087"),
            ("Before vs After yapısını kısa ama net açıkla.", "A150"),
        ] {
            let answer = answer_reviewed_atlas(question).expect("reviewed rescue should resolve");
            assert_eq!(answer.card_id, card_id);
        }
    }

    #[test]
    fn reviewed_quarantined_compiler_prose_is_replaced_not_exposed() {
        let all = answer_reviewed_atlas("All nedir ve nasıl kullanılır?")
            .expect("All should have a reviewed replacement");
        assert_eq!(all.card_id, "A073");
        assert!(all.answer_text.contains("sayılamayan"));

        let go_on = answer_reviewed_atlas("Go on doing vs Go on to do ne zaman kullanılır?")
            .expect("go on contrast should have a reviewed replacement");
        assert_eq!(go_on.card_id, "A118");
        assert!(go_on.answer_text.contains("yeni bir eyleme"));
    }

    #[test]
    fn one_word_topics_stay_exact_alias_only() {
        assert!(answer_reviewed_atlas("all any farkı ne?").is_none());
    }

    #[test]
    fn unresolved_topics_still_fail_closed() {
        for question in [
            "Narrative Tenses nedir ve nasıl kullanılır?",
            "Try doing vs Try to do ne zaman kullanılır?",
            "Mean doing vs Mean to do kullanım mantığını yeni başlayan birine anlat.",
            "Basic Word Order nedir ve nasıl kullanılır?",
        ] {
            assert!(answer_reviewed_atlas(question).is_none(), "question={question}");
        }
    }
}
