# CP17 FIX01 Patch Manifest

## Bug fixed

English Focus exported the real stored vocabulary entries, but pack analysis reused the stricter external-AI paste validator. As a result:

- reviewed user entries were rejected because validationStatus was not `unvalidated`
- core or override entries were rejected because source.kind was not `user`
- manually curated/core entries were rejected because generation.method was not `external-ai`

These are correct checks for pasted AI JSON, but incorrect for an English Focus transfer pack.

## Behavior after fix

- Single-entry pasted/generated JSON remains fully strict.
- Vocabulary packs skip only the three external-AI provenance rules.
- All structural, target-word, morphology, bilingual pairing, example, timestamp, duplicate, grammar, and quality checks remain active.
- The mixed-validity fixture still reports one valid and one invalid entry.
- A pack exported from the local layered library round-trips as valid.

## Files

- `apps/desktop/src/modules/import-export/application/ValidateVocabularySemantics.ts`
- `apps/desktop/src/modules/import-export/application/VocabularyPack.ts`
- `apps/desktop/src/modules/import-export/services/VocabularySemanticValidator.ts`
- `apps/desktop/src/modules/import-export/services/index.ts`
- `apps/desktop/tests/unit/import/vocabulary-pack.test.ts`
- `apps/desktop/tests/unit/import/semantic-validation.test.ts`
