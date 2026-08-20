// Manual, source-grounded replacements for compiled atlas prose that failed semantic review.
//
// The original compiled card remains embedded for provenance (rule/support IDs are unchanged),
// while this layer replaces only the Turkish rendering. A card is removed from quarantine only
// when the evidence bundled in the compiler output is sufficient to support a precise correction.

pub fn override_answer(card_id: &str) -> Option<&'static str> {
    match card_id {
        "A038" => Some(
            "Wish about the past: Geçmişte gerçekleşmiş ve artık değiştirilemeyen bir durum için pişmanlık veya ‘keşke’ anlamı verirken wish sonrasında geçmişe dönük perfect yapı kullanılır. Temel kalıp wish + past perfect, yani had + V3’tür. Geçmişte devam eden bir sürecin özellikle vurgulandığı bağlamlarda past perfect continuous da kullanılabilir. Buradaki zaman biçimi gerçek bir geçmiş olayı tarafsızca bildirmekten çok, geçmişe dönük hayali/gerçek dışı durumu ve pişmanlığı anlatır.",
        ),
        "A041" => Some(
            "Basic Passive Form: Passive voice, yapan kişiden çok eylemi veya eylemden etkilenen şeyi öne çıkarmak istediğimizde kullanılır. Temel pasif yapı, zamana uygun bir be biçimi + past participle (V3) ile kurulur. Eylemi yapan kişi bilinmiyorsa, önemsizse veya söylemek gerekmiyorsa hiç belirtilmeyebilir. Gayriresmî İngilizcede bazı pasif yapılarda be yerine get de görülebilir. Passive’i yalnızca active cümlenin mekanik dönüşümü gibi değil, bilgiyi farklı bir odakla sunan bağımsız bir yapı olarak düşünmek daha doğrudur.",
        ),
        "A065" => Some(
            "Some: Some en sık olumlu cümlelerde belirsiz bir miktar veya sayıdan söz ederken kullanılır. Sorularda konuşan ‘evet’ cevabı bekliyorsa ya da teklif/ricayı olumlu biçimde sunuyorsa some doğal olabilir; nötr sorularda ve olumsuz yapılarda ise çoğu zaman any tercih edilir. Vurgulu SOME, ‘hepsi değil, bir kısmı/bazıları’ anlamıyla olumlu, soru ve olumsuz cümlelerde de kullanılabilir. Some ayrıca bir sayıdan önce ‘yaklaşık’ anlamına gelebilir. Bütün bir sınıf hakkında genel hüküm verirken some kullanmak aynı şey değildir.",
        ),
        "A080" => Some(
            "Another / Other / Others: Another, tekil sayılabilir bir isimle ‘bir tane daha / başka bir’ anlamında kullanılır: another cup. Other bir isimden önce belirleyici olarak kullanılabilir ve bu kullanımda kendi başına çoğul eki almaz: other books. Others ise isim tekrar edilmediğinde, daha önce bağlamda belli olan başka kişiler veya şeyler için tek başına kullanılabilir: some stayed, others left. Kısacası another genellikle ek bir tekil öğeyi, other bir isimle birlikte ‘başka/diğer’ öğeleri, others ise ismin yerine geçen ‘diğerleri’ anlamını verir.",
        ),
        "A093" => Some(
            "Frequency Adverbs: Sıklık zarfları bir eylemin veya durumun ne kadar sık gerçekleştiğini gösterir; always, usually, often, sometimes ve never tipik örneklerdir. Konumları kullanılan fiil yapısına göre değişir: tek kelimelik be biçimlerinde zarf genellikle be’den sonra gelen tamamlayıcıdan önce yer alır (ör. is always ...); yardımcı fiilli yapılarda da sıklık zarfı yardımcı zincirinin içinde doğal konumuna gelir (ör. would often have ...). Bu zarfları yalnız Present Simple ile sınırlamak yanlıştır; başka zaman ve yardımcı fiil yapılarıyla da kullanılabilirler.",
        ),
        "A104" => Some(
            "Like vs As: Benzerlik anlatırken like ve as aynı yerde kullanılmaz. Like, bir isim veya zamirden önce preposition olarak çok doğaldır: like me. Bir fiil içeren clause ile benzerlik kurarken standart kullanımda as tercih edilir: as they do in China. Modern gayriresmî İngilizcede like, conjunction olarak as yerine de sık kullanılabilir. Ayrıca as you know gibi kalıplar, konuşan ve dinleyen arasında zaten ortak olduğu varsayılan bilgiyi tanıtabilir. Bu yüzden seçimde like + noun/pronoun ile as + clause ayrımı iyi bir başlangıç kuralıdır; informal kullanımda like + clause da görülebilir.",
        ),
        "A110" => Some(
            "Adjective + infinitive: To-infinitive bazı adjective yapılarından sonra doğal olarak gelir. Özellikle too + adjective + to-infinitive ve adjective + enough + to-infinitive kalıpları yaygındır: too old to learn gibi. Possible gibi bazı sıfatlarla for + kişi + to-infinitive yapısı da kullanılabilir. Ayrıca to be honest gibi bazı infinitive ifadeleri konuşanın tutumunu veya konuşma amacını belirtir. Yani ‘adjective + infinitive’ tek bir anlama indirgenmez; sıfat ve kalıbın işlevine göre infinitive tamamlayıcı veya değerlendirme/amaç ifadesi olabilir.",
        ),
        "A123" => Some(
            "That in relative clauses: That, bir ismi tanımlayan defining relative clause’u ana cümleye bağlamak için kullanılabilir: a company that makes furniture. Relative pronoun clause içinde nesne görevindeyse that bazı yapılarda düşürülebilir: the hotel (that) you recommended. Non-defining relative clauses ise zaten belli olan kişi veya şey hakkında ek bilgi verir ve kaynak örneklerinde who/which ile virgüllü olarak kurulur; defining ve non-defining kullanımı aynı şey gibi düşünmemek gerekir. Cleft sentence yapılarında da relative-clause benzeri that yapıları görülebilir, fakat bu ayrı bir cümle odaklama işlevidir.",
        ),
        "A135" => Some(
            "Such ... that: Such isim ve isim gruplarıyla kullanılır. Sayılabilir tekil isimde temel sıra such + a/an + noun, çoğul veya sayılamayan isimde ise such + noun biçimindedir. Sonuç bildiren yapılarda ardından gelen that-clause, bu derece veya niteliğin ortaya çıkardığı sonucu açıklar; Türkçede çoğu zaman ‘öyle ... ki’ mantığına yaklaşır. Ayrıca in such a way that kalıbı açıkça ‘öyle bir şekilde ki / bunun sonucunda’ anlamıyla sonuç ilişkisi kurabilir. Burada amaç bildiren so that yapısıyla sonuç bildiren such ... that yapısını birbirine karıştırmamak gerekir.",
        ),
        "A137" => Some(
            "Yes/No Questions: Yes/No questions, temel olarak cevabı yes veya no olabilen sorulardır ve İngilizcede soru kurarken düz cümle kelime dizilişini aynen bırakmak yerine yardımcı fiil ile öznenin konumuna dikkat etmek gerekir. Bu tür sorular ricada bulunmak için de çok sık kullanılır. Bir şeyin var olup olmadığını nötr biçimde sorarken any yaygındır; some ise konuşan olumlu cevap beklediğinde veya teklif/ricayı olumlu yönde çerçevelediğinde görülebilir. Kısa yes/no soruları konuşmada dinleyicinin ilgisini göstermenin bir yolu olarak da kullanılabilir.",
        ),
        "A157" => Some(
            "Inversion after negative adverbials: Never, rarely, seldom, hardly/scarcely ... when/before, no sooner ... than gibi olumsuz veya sınırlayıcı adverbial ifadeler cümlenin başına vurgu için getirildiğinde özne ile ilk yardımcı fiil yer değiştirir. Basit zamanda ayrı bir yardımcı fiil yoksa do/does/did desteği kullanılır: Seldom do we ... gibi. Neither ve nor bir önceki olumsuz ifadeye olumsuz ekleme yaparak clause başında kullanıldığında da inversion görülür. Ancak her not ile başlayan ifade otomatik inversion oluşturmaz; kaynak özellikle not far sonrasında inversion kullanılmadığını belirtir.",
        ),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::override_answer;

    #[test]
    fn reviewed_repairs_exist_only_for_explicit_cards() {
        for card_id in [
            "A038", "A041", "A065", "A080", "A093", "A104", "A110", "A123", "A135",
            "A137", "A157",
        ] {
            let answer = override_answer(card_id).expect("reviewed override should exist");
            assert!(!answer.trim().is_empty());
        }

        assert!(override_answer("A115").is_none());
        assert!(override_answer("A145").is_none());
    }
}
