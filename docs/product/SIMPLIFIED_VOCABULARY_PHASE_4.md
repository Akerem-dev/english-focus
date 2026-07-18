# Simplified Vocabulary — Phase 4

Status: implemented on `feat/simplified-vocabulary-experience`

## Completed

- Added a direct `Edit entry` action to vocabulary details.
- Added a structured editor for:
  - headword display
  - CEFR level
  - part of speech
  - registers
  - meanings and Turkish translations
  - pronunciation variants
  - word forms
  - concise bilingual usage explanation
  - three bilingual example sentences
  - optional etymology
- Core vocabulary is never rewritten. Editing a bundled word creates a local `override`.
- Existing user and override records are updated in their current storage layer.
- The editor validates the canonical vocabulary schema before persistence.
- Field paths and validation messages are shown inside the editor.
- Unsaved changes are protected on dialog close, Escape, backdrop click, and window unload.
- `Ctrl/Command + S` validates and saves the editor.
- JSON import remains available as a secondary advanced action.
- The currently open detail screen refreshes immediately with the saved local record.

## Compatibility

The editor preserves legacy hidden content fields while updating only the simplified visible fields. This avoids silent data loss until the later schema cleanup phase removes those fields through an explicit migration.

## Manual actions

No files need to be deleted manually in this phase.
