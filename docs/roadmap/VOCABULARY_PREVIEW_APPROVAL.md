# CP12 — Vocabulary Preview and Explicit Approval

## Purpose

CP12 adds the final human-review gate between automated content checks and later duplicate handling or persistence.

## Flow

1. JSON syntax passes.
2. The versioned vocabulary schema passes.
3. Blocking semantic checks pass.
4. Advisory quality warnings are displayed.
5. The user opens the complete preview.
6. The user reviews the entry across Overview, Meanings, Grammar, Examples, and Supporting content.
7. The user explicitly acknowledges the review and approves the preview.
8. The approval remains in memory only. Nothing is saved in CP12.

## Preview contract

The preview displays:

- Target word and primary Turkish translations
- CEFR, part of speech, registers, and pronunciation
- Schema, semantic, provenance, and example-count checklist
- Meaning, grammar, sentence-form, tense, and preposition content
- Exactly ten primary English examples with Turkish translations
- Word family, collocations, related words, common mistakes, and etymology when present
- Non-blocking quality warning count
- User-import provenance and current unvalidated status

Missing optional content is shown honestly. The preview never fabricates an empty grammar, etymology, idiom, or phrasal-verb section.

## Approval boundary

Preview approval is explicit and requires:

- Acknowledgement checkbox
- Separate `Approve preview` action

Approval does not:

- Write to SQLite
- Add an entry to Library
- Change validation status
- Resolve duplicates
- Modify user metadata

Those operations begin in later checkpoints.
