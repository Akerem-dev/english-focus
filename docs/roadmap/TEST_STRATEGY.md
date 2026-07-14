# Test Strategy

## 1. Test layers

### 1.1 Environment checks

Validate:

- supported Node and npm versions;
- public npm registry;
- no private proxy or registry leakage;
- required Rust/Tauri prerequisites when native work begins;
- project root and workspace structure.

### 1.2 Static checks

- structure check;
- forbidden-pattern scan;
- Prettier check;
- ESLint;
- TypeScript strict check;
- Rust formatting and checks when Rust implementation begins.

### 1.3 Unit tests

Cover deterministic logic:

- normalization;
- aliases and inflections;
- schema validation;
- semantic validation;
- instruction generation;
- correction instruction generation;
- duplicate strategy;
- backup retention;
- data migrations.

### 1.4 Component tests

Cover:

- input and keyboard behavior;
- focus visibility;
- dialog focus trapping;
- screen states;
- errors and loading states;
- long content rendering;
- bulk selection behavior.

### 1.5 Integration tests

Cover:

- frontend service to Tauri command boundary;
- repository operations;
- database migrations;
- FTS search;
- import transaction;
- backup and restore.

### 1.6 End-to-end tests

Core E2E journeys:

1. Launch app and navigate three routes.
2. Search existing word.
3. Search inflected form.
4. Search missing word and copy instruction.
5. Paste invalid JSON and receive correction instruction.
6. Paste valid JSON, preview, and add.
7. Restart and confirm persistence.
8. Edit metadata in Library.
9. Export and re-import an entry.
10. Backup, mutate, restore, and verify rollback.

### 1.7 Manual visual tests

Visual checks occur at approved checkpoints, not every internal patch.

Required window sizes:

- 1440 × 900
- 1280 × 800
- 1100 × 700
- minimum supported size, initially targeted at 960 × 640

Check Windows scaling where available:

- 100%
- 125%

## 2. Visual acceptance checklist

- EF logo is crisp.
- Sidebar alignment is consistent.
- Selected navigation uses one burgundy accent.
- No accidental gradients or glass effects.
- Serif headings and sans-serif controls are used consistently.
- Text does not clip.
- Dialogs do not exceed viewport height.
- Long word detail pages scroll without horizontal overflow.
- Focus indicators are visible.
- Disabled controls remain readable.
- Error states do not shift the whole layout unexpectedly.
- Narrow-window sidebar behavior matches the approved plan.

## 3. Functional acceptance principles

A feature is not accepted merely because it renders. It must:

- produce the correct state transition;
- handle invalid input;
- present actionable errors;
- preserve existing data;
- survive restart when persistence is expected;
- remain keyboard-operable;
- avoid console or terminal errors.

## 4. Performance targets

Initial V1 targets on a typical Windows laptop:

- cold app launch: target under 3 seconds after release build;
- route transition: visually immediate;
- exact word lookup: target under 100 ms after database readiness;
- typical FTS search: target under 200 ms for a 5,000-entry core pack;
- library scrolling: no obvious frame drops;
- 5,000-entry pack import: batched with responsive progress UI;
- startup must not parse the entire vocabulary pack synchronously on the UI thread.

Targets are measured after functionality is correct. Premature micro-optimization is avoided.

## 5. Accessibility tests

- full keyboard navigation;
- logical tab order;
- visible focus;
- dialog focus trap and focus restoration;
- labels for icon-only controls;
- semantic headings;
- sufficient contrast;
- reduced-motion behavior;
- announcements for validation, import completion, and destructive action results.

## 6. Data integrity tests

- replacement preserves user metadata;
- failed import leaves no partial entry set;
- failed restore leaves the previous database usable;
- migrations are transactional;
- export/import round-trip preserves supported fields;
- core-pack updates do not erase user overrides or metadata;
- duplicate strategies behave deterministically.

## 7. Checkpoint-specific user testing

The user is stopped only when a meaningful run is possible.

At each test checkpoint, `TEST_PLAN.md` must include:

- exact commands;
- expected terminal output;
- exact click/type sequence;
- expected UI result;
- visual inspection points;
- known intentional limitations;
- required report data if failure occurs.

## 8. Current CP00 test

No runtime command is required.

The user verifies:

1. The Part 0 ZIP extracts directly into the project root.
2. Only roadmap/status files are added or changed.
3. Existing `apps`, `packages`, and root `package.json` remain untouched.
4. The new roadmap documents can be opened in VS Code.
