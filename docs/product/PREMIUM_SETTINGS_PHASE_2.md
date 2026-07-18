# Premium Settings Redesign — Phase 2

Status: implemented on `feat/premium-settings-redesign`

## Scope

This phase simplifies General and Vocabulary content so the focused Settings workspace matches the approved premium mockup more closely.

## Completed

- Reduced the category rail to concise icon-and-label navigation.
- Moved application information into a small secondary card below the category rail.
- Added the application version and local SQLite storage summary.
- Moved content, schema, and storage diagnostics behind a native version-details disclosure.
- Rebuilt General as one calm preference list for theme, reduced motion, and interface size.
- Rebuilt Vocabulary content as one focused preference list.
- Kept the canonical three translated examples visible as a fixed product rule rather than a misleading adjustable control.
- Added target proficiency, explanation language, and a simplified explanation-detail control.
- Presented existing instruction detail values as Concise, Balanced, and Detailed without changing persisted values.
- Moved grammar, etymology, and usage-tip prompt controls behind Advanced customization.
- Preserved automatic saving and the existing settings providers.
- Updated Settings tests for the new hierarchy and labels.

## Compatibility

- No SQLite schema changes.
- No settings migrations.
- No instruction-preference schema changes.
- Existing `balanced`, `detailed`, and `maximum` stored values remain valid.
- Existing advanced prompt toggles remain available and continue to persist locally.

## Next phase

Phase 3 will turn Data & backups and Privacy & maintenance into focused summaries with secondary dialogs for diagnostics, recent activity, backup management, and protected local-data actions.
