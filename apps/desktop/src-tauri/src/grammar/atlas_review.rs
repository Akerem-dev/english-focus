// Compiled atlas cards stay embedded for auditability, but deterministic validator PASS alone
// is not enough to expose prose to users. These cards have a clear title/intent mismatch,
// misleading example, incomplete contrast, or an over-broad/incorrect claim discovered in
// the manual semantic audit. They fail closed until their grounded answer is replaced and
// re-reviewed.
const QUARANTINED_CARD_IDS: &[&str] = &[
    "A015", // Always with continuous forms: does not explain the 'always + continuous' intent.
    "A038", // Wish about the past: example expresses present ability rather than past regret.
    "A041", // Basic Passive Form: mixes an unrelated be + infinitive instruction into passive.
    "A047", // Passive reporting structures: omits the defining It is said / subject is said to patterns.
    "A051", // Reported Commands: answers reported speech generally instead of command structure.
    "A058", // Generic reference with articles: too vague and suggests article omission too freely.
    "A063", // This and That: answers informal degree use instead of demonstrative contrast.
    "A065", // Some: contains an unsupported absolute that requests require 'some'.
    "A066", // Any: too incomplete for a generic card; omits affirmative/free-choice use.
    "A073", // All: incorrectly reduces usage to plural nouns.
    "A074", // Every: contrast repeats the incorrect implication that all is plural-only.
    "A080", // Another / Other / Others: conflates determiner/pronoun behavior.
    "A089", // Adjective Order: does not provide a usable order beyond one pair.
    "A093", // Frequency Adverbs: incorrectly includes possibility adverbs such as perhaps/probably.
    "A100", // The more ... the more: does not actually explain/form the paired construction.
    "A104", // Like vs As: contains a confused/contradictory comparison.
    "A110", // Adjective + infinitive: example is unrelated to the taught structure.
    "A115", // Try doing vs Try to do: omits the experimental 'try doing' meaning.
    "A117", // Mean doing vs Mean to do: omits the involve/entail meaning of mean doing.
    "A118", // Go on doing vs Go on to do: omits the switch-to-next-activity meaning.
    "A123", // That in relative clauses: implies 'that' can introduce non-defining extra information.
    "A132", // So that: explanation is minimal and the supplied example is about a different structure.
    "A134", // So ... that: conflates the result construction with purpose 'so that'.
    "A135", // Such ... that: supplied example expresses purpose, not the result construction.
    "A137", // Yes/No Questions: defines the topic too narrowly and mixes unrelated quantifier guidance.
    "A145", // At / On / In for time: only teaches 'in' while leaving at/on largely unspecified.
    "A156", // Basic Word Order: does not teach the core clause order the title promises.
    "A157", // Negative-adverbial inversion: ends with a claim that contradicts its own do-support rule.
];

pub fn is_runtime_approved(card_id: &str) -> bool {
    !QUARANTINED_CARD_IDS.contains(&card_id)
}

#[cfg(test)]
mod tests {
    use super::{is_runtime_approved, QUARANTINED_CARD_IDS};

    #[test]
    fn quarantine_is_explicit_and_duplicate_free() {
        let unique = QUARANTINED_CARD_IDS
            .iter()
            .copied()
            .collect::<std::collections::HashSet<_>>();
        assert_eq!(unique.len(), QUARANTINED_CARD_IDS.len());
        assert_eq!(QUARANTINED_CARD_IDS.len(), 28);
    }

    #[test]
    fn approved_and_quarantined_examples_are_distinct() {
        assert!(is_runtime_approved("A068"));
        assert!(is_runtime_approved("A114"));
        assert!(!is_runtime_approved("A073"));
        assert!(!is_runtime_approved("A115"));
    }
}
