# Simplified Vocabulary — Phase 2B

Status: implemented on `feat/simplified-vocabulary-experience`

## Completed

- The canonical vocabulary schema now requires three primary examples.
- A compatibility input schema accepts legacy entries with ten examples and normalizes them to the
  first three.
- Entries with four through nine examples remain invalid.
- Bundled core content, SQLite reads, single-entry imports, and vocabulary-pack imports use the
  compatibility reader.
- Vocabulary-pack exports always write the canonical three-example form.
- The AI generation instruction now requests three examples and embeds the three-example JSON
  Schema.
- Import preview and validation copy no longer mention ten examples.
- The AI instruction dialog no longer shows the `Exactly 10 examples` chip.
- Test builders now create three-example entries.
- Native validation accepts both canonical three-example data and legacy ten-example data during the
  migration.

## Native compatibility boundary

The checked-in native JSON Schema remains on the legacy ten-example V1 shape temporarily so existing
desktop data remains valid. Rust expands a three-example entry only for structural validation, then
validates and persists the original three-example value. Intermediate counts remain rejected.

The native schema generator intentionally targets the temporary compatibility schema. This avoids a
hand-edited generated JSON Schema and keeps `npm run check:native-schemas` deterministic.

## Legacy fixtures

Bundled and manual JSON fixtures still contain ten examples in this phase. They serve as migration
coverage and are normalized at application boundaries. A later content-migration phase will rewrite
the fixture files and update their checksums.

## Manual actions

No files need to be deleted manually.
