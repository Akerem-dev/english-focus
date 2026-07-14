# Vocabulary Fixture and Read-Only Content Source

## Checkpoint

CP05B — canonical content fixture and validated local source.

## Canonical entry

The first production vocabulary record is stored as versioned JSON:

```text
apps/desktop/src/content/core/entries/maintain.entry.json
```

The JSON is parsed through `vocabularyEntrySchema` before it becomes available to the
application. The entry contains:

- four reviewed meanings with Turkish translations;
- UK and US pronunciation records;
- base, third-person, past, participle, and present-participle forms;
- word-family members;
- etymology with certainty metadata;
- applicable grammar patterns, tense examples, sentence forms, and prepositions;
- collocations and related-word distinctions;
- common learner mistakes;
- exactly ten primary examples with Turkish translations;
- reviewed core-pack generation metadata.

Empty phrasal-verb and idiom arrays are intentional. The application must not invent
structures that do not naturally apply to the target word.

## Read-only boundary

`VocabularyContentSource` exposes only:

- `listEntries()`;
- `getEntryById()`;
- `getEntryByNormalizedWord()`.

There are no mutation methods. User notes, favorites, tags, learning state, and review
state remain outside this source and will be persisted through a separate repository.

`ValidatedVocabularyContentSource` validates every candidate before publishing the
catalog, rejects duplicate IDs and normalized words, and deeply freezes accepted
content at runtime.

## Test builders

The testing package now provides fresh builders for:

- structurally valid vocabulary entries;
- separately stored vocabulary user metadata.

Builders return cloned values so one test cannot mutate another test's fixture state.
They exist only in `@platform/testing` and are not runtime production dependencies.

## Deferred work

This checkpoint does not yet:

- render the `maintain` detail screen;
- normalize arbitrary user search input;
- resolve aliases or inflected forms;
- persist content in SQLite;
- merge core, user, and override layers.

Those responsibilities remain in their scheduled read-only UI, search, and persistence
checkpoints.
