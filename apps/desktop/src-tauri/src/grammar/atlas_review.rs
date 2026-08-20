// Compiled atlas cards stay embedded for auditability, but deterministic validator PASS alone
// is not enough to expose prose to users. These cards still have a clear title/intent mismatch,
// incomplete contrast, or insufficient source evidence after manual semantic review. Cards that
// received an evidence-grounded replacement in atlas_overrides.rs are intentionally absent here.
const QUARANTINED_CARD_IDS: &[&str] = &[
    "A015", // Always with continuous forms: does not explain the 'always + continuous' intent.
    "A047", // Passive reporting structures: omits the defining It is said / subject is said to patterns.
    "A051", // Reported Commands: answers reported speech generally instead of command structure.
    "A058", // Generic reference with articles: too vague and suggests article omission too freely.
    "A063", // This and That: answers informal degree use instead of demonstrative contrast.
    "A066", // Any: too incomplete for a generic card; omits affirmative/free-choice use.
    "A073", // All: incorrectly reduces usage to plural nouns.
    "A074", // Every: its generic contrast still depends on an incomplete account of all.
    "A089", // Adjective Order: does not provide a usable general order beyond one pair.
    "A100", // The more ... the more: does not actually explain/form the paired construction.
    "A115", // Try doing vs Try to do: omits the experimental 'try doing' meaning.
    "A117", // Mean doing vs Mean to do: omits the involve/entail meaning of mean doing.
    "A118", // Go on doing vs Go on to do: omits the switch-to-next-activity meaning.
    "A132", // So that: evidence identifies purpose clauses but does not ground the actual form well enough.
    "A134", // So ... that: source span conflates wording and does not safely ground the construction form.
    "A145", // At / On / In for time: only teaches 'in' while leaving at/on largely unspecified.
    "A156", // Basic Word Order: does not teach the core clause order the title promises.
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
        assert_eq!(QUARANTINED_CARD_IDS.len(), 17);
    }

    #[test]
    fn approved_repaired_and_quarantined_examples_are_distinct() {
        assert!(is_runtime_approved("A068"));
        assert!(is_runtime_approved("A104"));
        assert!(is_runtime_approved("A157"));
        assert!(!is_runtime_approved("A073"));
        assert!(!is_runtime_approved("A115"));
    }
}
