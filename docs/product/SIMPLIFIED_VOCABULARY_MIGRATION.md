# Simplified Vocabulary Experience Migration

Status: Phase 1 complete — scope inventory and migration boundaries

Target branch: `feat/simplified-vocabulary-experience`

Base branch: `main`

## Product goal

English Focus will remain a local-first vocabulary application, but the primary experience will be simplified around four user tasks:

1. Find a word.
2. Read its essential information.
3. Edit the entry directly in the app.
4. Browse and open saved words from Library.

The redesign must remain an editorial language-learning tool. It must not become a dashboard, gamified learning product, or AI chat interface.

## Approved visible information

A vocabulary entry will present only the following user-facing information:

- English word
- Turkish meaning
- CEFR level
- Part of speech
- Register labels when useful, such as Neutral or Formal
- Pronunciation
- Word forms
- A short grammar or usage explanation
- Three example sentences with Turkish translations
- Etymology when available

## Features to remove from the user experience

The following concepts must be removed consistently from navigation, detail pages, previews, settings, filters, dialogs, exported content, validation messages, tests, and generated content instructions:

- Word family
- Collocations
- Related words
- Common mistakes
- Grammar patterns
- Learning status
- Review status
- Known chip
- Reviewed chip
- Editorially reviewed label
- Exactly 10 examples indicator
- Ten-example requirement
- Filter by layer
- Learning status filter

The internal storage-layer distinction between `core`, `user`, and `override` remains required. It will no longer be exposed as a Library filter.

## Library requirements

### Header

Remove the Library subtitle:

`Search, organize, review, and export vocabulary entries stored on this device.`

### Alphabet and search

- Remove the large Collection Tools card treatment.
- Move the alphabet closer to the Library heading.
- Increase letter size and spacing.
- Give active and hover states short, functional motion.
- Keep unavailable letters visibly disabled.
- Place a lightly shaped search field directly below the alphabet.
- Keep CEFR, Favorites, and Sort controls.
- Remove Layer and Learning Status controls.

### Results

- Use one shared CEFR badge component everywhere.
- Give every CEFR level a distinct accessible visual tone.
- Align the Level column closer to the right edge.
- Replace the browser-default checkbox appearance with an accessible premium checkbox style.
- Clicking a word opens its full vocabulary detail state.
- Clicking non-link row space may continue to update the preview.
- Checkbox interaction must never open the word.

## Navigation requirements

- The complete English Focus brand area in the upper-left sidebar must navigate to the Vocabulary screen.
- Vocabulary remains the home screen.
- Search and word details remain states inside Vocabulary rather than new primary navigation routes.
- Returning from a Library-opened entry should restore the previous Library search, filter, and scroll context where practical.

## Direct editing requirements

Add an `Edit entry` action to the vocabulary detail header.

The editor must support:

- Word
- Turkish translation or translations
- CEFR
- Part of speech
- Registers
- Pronunciation
- Word forms
- Short grammar or usage explanation
- Up to three example sentences and Turkish translations
- Optional etymology

Editing behavior:

- User entries are updated in their user layer.
- Core entries are never mutated in the bundled core pack.
- Editing a core entry creates or updates a user override.
- Validation runs before saving.
- Save, Cancel, field-level errors, and unsaved-change protection are required.
- JSON import/export may remain as an advanced capability, but importing replacement JSON must no longer be the primary editing workflow.

## Compatibility strategy

The migration must not invalidate existing local data without an explicit migration path.

### Old vocabulary JSON

Legacy entry files may contain fields that are no longer shown or exported. The importer will temporarily accept those fields, normalize the entry into the simplified model, and ignore removed content.

### Old user metadata

Legacy metadata may contain learning and review status values. A compatibility reader will accept those values during migration, while new writes omit them after the metadata schema transition.

### Storage layers

`core`, `user`, and `override` remain internal architectural concepts because direct editing of bundled content depends on overrides.

## Confirmed implementation surface

### Product and engineering rules

- `AGENTS.md`
- `docs/product/VOCABULARY_OUTPUT_SPEC.md`
- `docs/content/CORE_PILOT_PACK.md`
- `CHANGELOG.md`

`AGENTS.md` currently refers to learning status as protected user metadata. That rule must be revised only when the metadata migration is implemented.

### Domain model

- `packages/domain/src/vocabulary/VocabularyEntry.ts`
- `packages/domain/src/vocabulary/Collocation.ts`
- `packages/domain/src/vocabulary/CommonMistake.ts`
- `packages/domain/src/vocabulary/RelatedWord.ts`
- `packages/domain/src/vocabulary/WordFamilyItem.ts`
- `packages/domain/src/vocabulary/GrammarAnalysis.ts`
- `packages/domain/src/library/LearningStatus.ts`
- `packages/domain/src/library/ReviewStatus.ts`
- `packages/domain/src/library/VocabularyUserMetadata.ts`
- `packages/domain/src/library/index.ts`
- `packages/domain/src/settings/ContentSettings.ts`

### Schemas and native schema mirrors

- `packages/schemas/src/vocabulary/vocabulary-entry.schema.ts`
- `packages/schemas/src/vocabulary/vocabulary-components.schema.ts`
- `packages/schemas/src/vocabulary/vocabulary-user-metadata.schema.ts`
- `packages/schemas/src/settings/app-settings.schema.ts`
- `apps/desktop/src-tauri/schemas/vocabulary-entry.schema.json`
- `apps/desktop/src-tauri/schemas/vocabulary-user-metadata.schema.json`
- `apps/desktop/src-tauri/schemas/app-settings.schema.json`
- `apps/desktop/src-tauri/src/validation.rs`
- `scripts/generate-native-json-schemas.ts`

Native JSON schemas must be regenerated from the TypeScript schemas. They must not be hand-edited independently.

### Library

- `apps/desktop/src/modules/library/pages/LibraryPage.tsx`
- `apps/desktop/src/modules/library/application/libraryRecords.ts`
- `apps/desktop/src/styles/library.css`
- Library component tests and keyboard interaction tests

### Sidebar

- `apps/desktop/src/app/layout/AppSidebar.tsx`
- Sidebar/navigation tests

### Vocabulary detail

- `apps/desktop/src/modules/vocabulary/pages/VocabularyPage.tsx`
- `apps/desktop/src/modules/vocabulary/components/VocabularyFoundState.tsx`
- `apps/desktop/src/modules/vocabulary/components/VocabularyHeader.tsx`
- `apps/desktop/src/modules/vocabulary/components/VocabularyQuickSummary.tsx`
- `apps/desktop/src/modules/vocabulary/components/GrammarSection.tsx`
- `apps/desktop/src/modules/vocabulary/components/ExampleSentenceList.tsx`
- `apps/desktop/src/modules/vocabulary/components/WordFamilySection.tsx`
- `apps/desktop/src/modules/vocabulary/components/CollocationsSection.tsx`
- `apps/desktop/src/modules/vocabulary/components/RelatedWordsSection.tsx`
- `apps/desktop/src/modules/vocabulary/components/CommonMistakesSection.tsx`
- `apps/desktop/src/modules/vocabulary/components/VocabularyMetadataDialog.tsx`
- `apps/desktop/src/modules/vocabulary/presenters/VocabularyEntryPresenter.ts`
- `apps/desktop/src/styles/vocabulary-detail.css`

### Direct editing

A new application-level edit workflow is required. The UI must not call Tauri or SQLite directly.

Expected implementation areas:

- Vocabulary page state and detail header
- New entry editor component or dialog
- Application use case for validating and saving edits
- Existing vocabulary repository port
- Tauri vocabulary repository implementation
- Override resolution and refresh behavior
- Editor tests

### Import, export, validation, and generation

- `apps/desktop/src/modules/import-export/application/CompareDuplicateEntries.ts`
- `apps/desktop/src/modules/import-export/application/PreviewVocabularyImport.ts`
- `apps/desktop/src/modules/import-export/application/ResolveDuplicateEntry.ts`
- `apps/desktop/src/modules/import-export/overlays/DuplicateComparisonDialog.tsx`
- `apps/desktop/src/modules/import-export/overlays/VocabularyPreviewDialog.tsx`
- `apps/desktop/src/modules/import-export/services/VocabularyQualityInspector.ts`
- `apps/desktop/src/modules/import-export/services/VocabularySemanticValidator.ts`
- `apps/desktop/src/modules/instruction/templates/vocabulary-instruction.template.ts`
- `scripts/check-core-content.mjs`

### Settings

- `apps/desktop/src/modules/settings/pages/SettingsPage.tsx`
- `apps/desktop/src/modules/settings/application/GetSettings.ts`
- Content-related settings components and tests

The example sentence preference must be removed or constrained to the new product rule. The normal detail view shows three examples and no `Exactly 10` chip.

### Content and fixtures

- `apps/desktop/src/content/core/coreVocabularyEntries.ts`
- `apps/desktop/src/content/core/entries/*.entry.json`
- `testing/manual/*.json`
- `packages/testing/src/builders/VocabularyEntryBuilder.ts`
- `packages/testing/src/builders/VocabularyUserMetadataBuilder.ts`

All bundled and test entries must migrate through a repeatable script rather than manual one-by-one editing.

### Tests requiring review

- Vocabulary detail component tests
- Library component tests
- Settings component tests
- Vocabulary schema tests
- User metadata schema tests
- Import preview tests
- Duplicate comparison and resolution tests
- Semantic validation tests
- Quality inspection tests
- Core pack tests
- Native validation tests
- End-to-end navigation and editing tests

## Planned deletion queue

No file is deleted in Phase 1.

After references and schemas are migrated, the following UI components are expected to become removable:

- `apps/desktop/src/modules/vocabulary/components/WordFamilySection.tsx`
- `apps/desktop/src/modules/vocabulary/components/CollocationsSection.tsx`
- `apps/desktop/src/modules/vocabulary/components/RelatedWordsSection.tsx`
- `apps/desktop/src/modules/vocabulary/components/CommonMistakesSection.tsx`

The following domain files may become removable only after schema compatibility and import migration are complete:

- `packages/domain/src/vocabulary/Collocation.ts`
- `packages/domain/src/vocabulary/CommonMistake.ts`
- `packages/domain/src/vocabulary/RelatedWord.ts`
- `packages/domain/src/vocabulary/WordFamilyItem.ts`
- `packages/domain/src/library/LearningStatus.ts`
- `packages/domain/src/library/ReviewStatus.ts`

Deletion must occur in the same commit that removes the final import/export, schema, builder, test, and barrel-export references.

## Implementation phases

### Phase 2 — Simplified data contract

- Define the simplified entry model.
- Add legacy input normalization.
- Update TypeScript and generated native schemas.
- Reduce the example requirement to three.
- Update builders, fixtures, and core content.
- Keep the application compiling before UI cleanup.

### Phase 3 — Simplified detail presentation

- Reduce detail navigation.
- Remove obsolete sections and status chips.
- Keep pronunciation, word forms, meanings, short grammar, examples, and optional etymology.
- Delete unused UI section components after references are gone.

### Phase 4 — Direct entry editing

- Add Edit entry.
- Validate and save user entries or overrides.
- Add unsaved-change protection and errors.
- Retain JSON actions as secondary advanced actions.

### Phase 5 — Library redesign

- Remove subtitle and controls card.
- Redesign alphabet and search.
- Remove Layer and Learning Status filters.
- Add shared CEFR badges.
- Improve checkbox styling and Level alignment.

### Phase 6 — Navigation and open-entry workflow

- Make sidebar brand navigate home.
- Open Library words in Vocabulary detail state.
- Preserve Library return context.
- Verify keyboard and screen-reader behavior.

### Phase 7 — Repository-wide cleanup and release verification

- Remove dead files and exports.
- Regenerate schemas.
- Run migration checks.
- Run all quality and release checks.
- Build and verify the Windows package.

## Required checks after implementation phases

Run the smallest relevant checks during each phase and the complete release suite at the end:

```bash
npm run check:structure
npm run check:forbidden
npm run check:css-tokens
npm run check:dead-code
npm run format:check
npm run lint
npm run check:native-schemas
npm run check:core-content
npm run typecheck
npm run test
npm run test:performance
npm run build
npm run test:e2e
npm run check:bundle
```

## Phase 1 acceptance record

- Migration branch created.
- Product simplification decisions recorded.
- Compatibility boundaries recorded.
- High-impact source, schema, UI, persistence, content, and test areas mapped.
- No production code changed.
- No files deleted.
