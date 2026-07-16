# Changelog

## [Unreleased]

### Changed

- Removed obsolete checkpoint, patch-delivery, and superseded release-candidate scaffolding.
- Reduced public barrel exports and removed unreachable component, service, and helper code.
- Kept only editorially reviewed bundled vocabulary; generated template entries are not shipped.

## [1.0.0] - 2026-07-17

### Added

- Three-screen Vocabulary, Library, and Settings desktop application.
- Layered local vocabulary, personal metadata, JSON validation, import/export, and duplicate review.
- Local SQLite persistence, backup/restore, diagnostics, activity, and guarded data reset.
- Keyboard, accessibility, performance, release, native-schema, and Windows installer quality gates.

### Security

- External AI bridge contains no provider, API key, local model, RAG, or chat integration.
- Imported JSON is parsed and validated before persistence; user metadata remains a separate layer.
