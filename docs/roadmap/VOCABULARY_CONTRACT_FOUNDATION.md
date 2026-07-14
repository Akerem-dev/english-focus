# CP05A — Vocabulary Contract Foundation

## Purpose

Define the stable V1 content boundary before fixtures, search, import, persistence, or UI rendering depend on it.

## Content and user-state separation

`VocabularyEntry` contains replaceable vocabulary content. `VocabularyUserMetadata` contains user-owned state. Replacing a core or user entry must never delete favorites, tags, notes, learning state, review state, or view history.

## Versioning

The current entry contract is `1.0.0`. Every imported or bundled entry must declare this version. Unsupported or missing versions are detected before parsing or migration.

## Required entry sections

- identity, normalized lookup form, aliases
- pronunciation variants
- CEFR, registers, and parts of speech
- one or more meanings with Turkish translations
- morphology and inflected forms
- word family
- optional etymology with certainty
- grammar summary and only naturally applicable structures
- collocations, real phrasal verbs, and real idioms
- related words and common mistakes
- exactly ten primary English examples with Turkish translations
- source, generation, validation, and timestamps

Empty grammar, tense, sentence-form, preposition, phrasal-verb, or idiom arrays are valid. The contract must never force fabricated language structures.

## Runtime validation

The Zod schema:

- is strict and rejects unknown properties
- accepts only schema version `1.0.0`
- requires exactly ten primary examples
- verifies unique primary example identifiers
- verifies that every meaning part of speech is declared by the entry
- limits collection and text sizes before later semantic and quality checks
- exports a JSON Schema representation for the future external-AI instruction builder

## Deliberately deferred

- canonical `maintain` fixture and full content review
- search normalization implementation
- semantic and quality scoring beyond the structural invariants above
- vocabulary-pack envelope schema
- older-version migration transforms
- SQLite serialization and repositories
- vocabulary detail presentation
