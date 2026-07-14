# English Focus V1 — Master Roadmap

## 1. Document purpose

This roadmap defines the controlled implementation path from the approved final skeleton to a finished, testable Windows desktop application.

The project is not developed by sending isolated files without context. Work is delivered as small patch ZIP files that are copied directly into the existing project root. Every patch has one clear technical purpose, a bounded file set, explicit acceptance criteria, and a rollback point.

The product is a fully local personal English vocabulary library. It has exactly three primary routes:

1. Vocabulary
2. Library
3. Settings

Search, word detail, import, validation, preview, duplicate handling, backup, and diagnostic experiences are states or overlays inside those three routes.

## 2. Final product boundaries

### 2.1 Included in V1

- Tauri 2 Windows desktop shell
- React and strict TypeScript user interface
- Local SQLite database
- SQLite FTS5 search index
- Core vocabulary layer
- User vocabulary layer
- User overrides for core entries
- User metadata stored independently from vocabulary content
- Search normalization and inflected-form resolution
- Rich vocabulary detail rendering
- External-AI instruction generation without an API
- JSON paste, cleaning, parsing, schema validation, semantic validation, and quality checks
- Correction instruction generation
- Vocabulary preview
- Duplicate comparison and resolution
- Library search, filtering, sorting, pagination, selection, and bulk actions
- Favorites, tags, notes, learning status, and review status
- Single-entry import and export
- Vocabulary-pack import and export
- Backup, restore, retention, and migration handling
- Command bar and keyboard shortcuts
- Undo for reversible local actions
- Diagnostics and FTS rebuild
- Accessibility and reduced-motion support
- Production Windows packaging

### 2.2 Explicitly excluded from V1

- OpenAI API, Anthropic API, Gemini API, or any other embedded AI provider
- API-key fields
- Ollama or any local language model
- PDF ingestion or RAG
- Cloud sync
- User accounts or subscriptions
- Gamification, XP, streaks, leaderboards, or achievements
- Future grammar, reading, listening, or writing modules
- Fake “coming soon” screens
- Analytics collection or telemetry by default

## 3. Delivery model

### 3.1 Patch ZIPs

Every delivery is a patch ZIP whose contents are copied directly into the project root.

A normal patch contains only:

- files added by that part;
- files changed by that part;
- patch documentation;
- a deletion list if removal is required.

A patch must never contain:

- `node_modules`;
- `target`;
- build output;
- machine-specific absolute paths;
- a lockfile generated against a private registry;
- secret files;
- unrelated refactors.

### 3.2 Patch sizing

Patch size is determined by cohesion, not by a fixed file count.

Preferred ranges:

- Documentation-only patch: 5–10 files
- Configuration patch: 3–12 files
- Small feature patch: 6–18 files
- Medium vertical slice: 12–30 files
- Test-checkpoint patch: only the files required to reach one complete testable result

A patch larger than 30 implementation files requires a written reason in `PATCH_MANIFEST.md`.

### 3.3 Checkpoints

A checkpoint is a state that the user can run and test meaningfully.

A checkpoint becomes `LOCKED` only after:

1. automated checks pass;
2. the application launches on the user's Windows machine;
3. the requested functional tests pass;
4. visual inspection passes or accepted visual deviations are documented;
5. no blocker remains.

If a checkpoint fails, work remains on that checkpoint. New feature work does not begin until the failure is resolved.

## 4. Implementation phases and parts

---

# Phase 0 — Process foundation

## Part 0A — Roadmap and patch protocol

**Purpose:** Establish the immutable delivery rules before code changes begin.

**Files:**

- `docs/roadmap/MASTER_ROADMAP.md`
- `docs/roadmap/CHECKPOINTS.md`
- `docs/roadmap/PATCH_RULES.md`
- `docs/roadmap/TEST_STRATEGY.md`
- `PROJECT_STATUS.md`
- `CHECKPOINT.md`
- `PATCH_MANIFEST.md`
- `DELETE_FILES.txt`

**Code changes:** None.

**User test:** Confirm the ZIP copies into the project root and no existing source file is replaced.

**Checkpoint:** No runtime checkpoint. This is the planning baseline.

## Part 0B — Skeleton audit record

**Purpose:** Record current skeleton strengths, missing executable pieces, ownership boundaries, and risks.

**Expected files:**

- `docs/roadmap/SKELETON_AUDIT.md`
- updates to `PROJECT_STATUS.md`

**Code changes:** None unless a structurally invalid placeholder blocks the next part.

---

# Phase 1 — Clean local development foundation

## Part 1A — Public npm and environment guard

**Purpose:** Prevent recurrence of private-registry or environment contamination.

**Expected files:**

- `.npmrc`
- `scripts/check-environment.mjs`
- root `package.json` script additions
- patch documents

**Rules:**

- No `package-lock.json` is shipped in this part.
- `.npmrc` pins the public npm registry.
- The environment script detects private registry values, unsupported Node versions, and obvious stale-install conditions.

**User test:**

1. Confirm `npm config get registry` returns `https://registry.npmjs.org/`.
2. Run the environment check.
3. Run `npm install` on the user's machine.
4. Confirm a locally generated `package-lock.json` contains no private OpenAI host.

**Checkpoint CP01 — Dependency installation:**

- `npm install` completes successfully.
- No `ETIMEDOUT` to an internal registry.
- No red npm error.
- Lockfile is generated locally.

## Part 1B — Minimal browser runtime

**Purpose:** Establish the smallest functioning React/Vite app before Tauri is involved.

**Expected files:**

- desktop HTML entry
- Vite configuration
- TypeScript application configuration
- React entry point
- one minimal application component
- minimal reset stylesheet

**User test:**

- Run `npm run dev`.
- Open the local Vite URL.
- Confirm a plain English Focus baseline screen renders.
- Confirm browser console has no errors.

**Checkpoint CP02 — Browser runtime:** Browser app launches reliably.

## Part 1C — Tauri runtime

**Purpose:** Launch the same minimal app inside the native Windows shell.

**Expected files:**

- minimal Tauri config corrections
- Rust entry files if placeholders are incomplete
- capability file corrections
- app icon placeholders only where required by Tauri

**User test:**

- Run `npm run desktop`.
- Confirm a native English Focus window opens.
- Confirm close, minimize, maximize, and resize work.

**Checkpoint CP03 — Native runtime:** Tauri desktop window launches.

---

# Phase 2 — Design system and application shell

## Part 2A — Design tokens

**Purpose:** Implement the visual source of truth before building screens.

**Expected implementation:**

- color tokens
- typography tokens
- spacing scale
- border and radius tokens
- elevation tokens
- motion tokens
- focus-ring tokens
- z-index layers
- narrow-window breakpoints

**Acceptance criteria:**

- No component contains arbitrary repeated color values.
- Burgundy is a single controlled accent.
- Warm off-white and charcoal values match the approved mockup family.
- Reduced-motion override exists.

## Part 2B — Primitive components

**Purpose:** Create reusable, accessible primitives.

**Expected components:**

- Button
- IconButton
- TextField
- SearchField
- SelectField
- Checkbox
- Radio
- Switch
- Badge
- Tag
- Divider
- Card
- Dialog shell
- Tooltip
- Spinner
- Skeleton

**Acceptance criteria:**

- Keyboard focus is visible.
- Components expose semantic HTML behavior.
- Disabled, hover, active, focus, error, and loading states exist.
- No feature-specific business logic is included.

## Part 2C — App shell and routing

**Purpose:** Implement the three-route desktop shell.

**Expected implementation:**

- EF monogram rendered as SVG
- sidebar
- top bar
- Vocabulary route
- Library route
- Settings route
- selected navigation state
- narrow-window icon-only sidebar
- application-level error boundary

**User test:**

- Launch desktop app.
- Navigate among all three routes.
- Resize through agreed window sizes.
- Verify focus navigation.
- Compare visual structure against approved screens.

**Checkpoint CP04 — Visual shell:** First serious functional and visual checkpoint.

---

# Phase 3 — Vocabulary domain foundation

## Part 3A — Domain type decisions

**Purpose:** Finalize the vocabulary aggregate before persistence or UI rendering.

**Key entities:**

- VocabularyEntry
- VocabularyMeaning
- PartOfSpeechBlock
- GrammarPattern
- ExampleSentence
- Collocation
- RelatedWord
- CommonMistake
- WordFamilyMember
- Etymology
- VocabularySourceMetadata
- UserVocabularyMetadata

**Important invariant:** User metadata is separate from vocabulary content so replacing content cannot erase favorites, notes, tags, or study state.

## Part 3B — Runtime schemas

**Purpose:** Implement schema-versioned Zod validation.

**Requirements:**

- strict unknown-key policy where appropriate;
- deterministic validation errors;
- exact 10 primary examples;
- Turkish translation required for every primary example;
- controlled CEFR values;
- controlled certainty values;
- grammar patterns only when applicable;
- semantic rules separated from structural validation.

## Part 3C — Complete fixture

**Purpose:** Add one canonical, high-quality `maintain` entry.

**Fixture must include:**

- aliases and inflections;
- pronunciation;
- multiple senses;
- Turkish translations;
- morphology;
- word family;
- grammar patterns;
- tense and sentence-form examples where applicable;
- prepositions;
- collocations;
- related words;
- common mistakes;
- exactly 10 primary examples;
- metadata.

**Checkpoint CP05 — Domain and fixture:** Schemas validate the fixture and reject deliberate invalid variants.

---

# Phase 4 — Vocabulary read-only experience

## Part 4A — Vocabulary initial state

- search hero
- recent history placeholders backed by a local in-memory repository
- recent additions placeholders
- keyboard focus behavior

## Part 4B — Word detail header and overview

- word heading
- pronunciation
- CEFR and part of speech
- Turkish summary
- favorite and review controls initially read-only or locally mocked only if explicitly documented

## Part 4C — Long-content sections

- meanings
- grammar
- collocations
- related words
- common mistakes
- word family
- etymology
- exactly 10 example sentences
- sticky or in-page section navigation if needed

**Checkpoint CP06 — Read-only vocabulary:** `maintain` renders completely without layout breakage.

---

# Phase 5 — Search flow

## Part 5A — Query normalization

Rules include:

- trimming;
- case folding;
- Unicode normalization;
- English-letter validation;
- whitespace handling;
- alias lookup;
- inflection lookup;
- explicit handling of phrases and punctuation.

## Part 5B — Search state machine

States:

- initial;
- typing;
- searching;
- found;
- not found;
- invalid;
- loading;
- repository error.

## Part 5C — Initial local repository

Before SQLite, a small typed in-memory repository provides deterministic testing.

**User test matrix:**

- `maintain`
- ` Maintain `
- `MAINTAIN`
- `maintained`
- `maintaining`
- unknown valid word
- punctuation input
- multi-word input
- blank input

**Checkpoint CP07 — Search vertical slice:** Search reaches correct states and renders the fixture.

---

# Phase 6 — External-AI instruction bridge

## Part 6A — Instruction preferences

Preferences include:

- Turkish explanation language;
- detail level;
- proficiency target;
- exactly 10 examples;
- inclusion of word family, grammar notes, mistakes, etymology, and usage tips.

No provider selection or API key fields are permitted.

## Part 6B — Instruction builder

Generates a deterministic instruction containing:

- target word;
- schema version;
- required JSON shape;
- content quality rules;
- no-extra-text rule;
- applicable-grammar rule;
- exact-example-count rule.

## Part 6C — Instruction dialog and clipboard

**Checkpoint CP08 — Copyable instruction:** User can copy a complete external-AI prompt for an unknown word.

---

# Phase 7 — JSON ingestion and validation

## Part 7A — Paste dialog

- large code field;
- paste action;
- clear action;
- import-from-file action;
- input-size guard;
- keyboard behavior.

## Part 7B — Cleaning and parsing

Cleaners handle:

- Markdown code fences;
- leading and trailing explanations;
- BOM;
- accidental whitespace;
- one recoverable JSON object only.

No dangerous heuristic rewriting is allowed.

## Part 7C — Structural validation

- Zod schema errors;
- stable JSON-path error representation;
- error grouping.

## Part 7D — Semantic validation

Examples:

- target word matches normalized entry word;
- examples contain the target or a legitimate form where expected;
- part-of-speech blocks are coherent;
- no duplicate primary examples;
- translations are present;
- grammar notes do not claim clearly inapplicable structures.

## Part 7E — Quality checks

- minimum definition quality;
- excessive duplication;
- suspiciously generic translations;
- malformed pronunciation;
- weak or duplicated collocations;
- excessive unsupported certainty.

## Part 7F — Validation result and correction instruction

**Checkpoint CP09 — Validation workflow:** Invalid JSON produces actionable issues and a copyable correction prompt.

---

# Phase 8 — Preview and temporary add flow

## Part 8A — Vocabulary preview

Validated entries render through the same read-only components used by stored entries.

## Part 8B — Duplicate detection contract

- exact normalized word;
- core vs user entry;
- existing override;
- content version and timestamps.

## Part 8C — In-memory add

Before SQLite, a temporary repository confirms the full flow:

search unknown → instruction → paste → validate → preview → add → search found.

**Checkpoint CP10 — Complete in-memory product loop:** First full user value loop.

---

# Phase 9 — SQLite persistence

## Part 9A — Tauri command boundary

Frontend never opens the database directly. Typed commands expose repository actions.

## Part 9B — Initial migration

Tables separate:

- core entries;
- user entries;
- user overrides;
- user metadata;
- tags and entry tags;
- search aliases/forms;
- settings;
- import history;
- backup records;
- schema metadata.

## Part 9C — Repository implementation

- transactions;
- typed error mapping;
- no silent data loss;
- deterministic duplicate behavior.

## Part 9D — FTS5 index

- searchable word;
- aliases;
- inflections;
- definitions;
- translations;
- controlled ranking.

**Checkpoint CP11 — Persistent search:** Restarting the application preserves imported data and metadata.

---

# Phase 10 — Library

## Part 10A — Normal and empty states

## Part 10B — Search, filters, and sort

Filters:

- CEFR;
- part of speech;
- favorite;
- tag;
- source layer;
- learning status;
- review status.

Sort:

- alphabetical;
- recently added;
- recently updated;
- last viewed;
- view count.

## Part 10C — Quick preview

## Part 10D — Favorites, tags, and notes

## Part 10E — Learning and review status

## Part 10F — Selection, bulk actions, and undo

**Checkpoint CP12 — Library management:** Main local-management workflow is testable.

---

# Phase 11 — Import and export

## Part 11A — Single-entry export

## Part 11B — Single-entry import

## Part 11C — Vocabulary-pack import

- streaming or batched processing;
- progress;
- cancellation boundary;
- malformed-entry strategy;
- duplicate strategy.

## Part 11D — Import summary

## Part 11E — Duplicate comparison

Strategies:

- keep existing;
- replace content while preserving metadata;
- create/update override for a core entry;
- merge user notes only when explicitly selected.

**Checkpoint CP13 — Import/export:** Pack and single-entry operations preserve data integrity.

---

# Phase 12 — Settings and data safety

## Part 12A — General and content settings

## Part 12B — Instruction settings

## Part 12C — Appearance and accessibility settings

## Part 12D — Backup creation

## Part 12E — Backup restore

## Part 12F — Automatic retention

## Part 12G — Clear-data flows

**Checkpoint CP14 — Data safety:** Backup and restore round-trip passes.

---

# Phase 13 — Desktop productivity features

## Part 13A — Command bar

## Part 13B — Keyboard shortcuts

## Part 13C — Search history

## Part 13D — Undo service

## Part 13E — Diagnostics

- app version;
- schema version;
- database size;
- entry counts;
- last backup;
- integrity check;
- FTS rebuild;
- diagnostic report without personal vocabulary content by default.

**Checkpoint CP15 — Productivity and diagnostics.**

---

# Phase 14 — Hardening

## Part 14A — Accessibility audit

- keyboard-only flow;
- focus trapping;
- labels;
- contrast;
- reduced motion;
- screen-reader semantics.

## Part 14B — Performance audit

Targets are defined in `TEST_STRATEGY.md`.

## Part 14C — Error and recovery audit

## Part 14D — Security review

## Part 14E — Windows packaging

**Checkpoint CP16 — Release candidate.**

---

# Phase 15 — Core vocabulary pack

## Part 15A — 100-entry pilot

## Part 15B — Pilot validation and manual review

## Part 15C — Incremental expansion

Recommended batches:

- 500 entries;
- 1,000 entries;
- 2,500 entries;
- 5,000 entries.

The pack is versioned separately from user data so application updates do not overwrite user metadata.

**Checkpoint CP17 — Final V1 content release.**

## 5. Global engineering rules

### 5.1 Type safety

- TypeScript strict mode remains enabled.
- No `any` in production code.
- Unknown external data is validated before use.
- Tauri command input and output are typed and runtime-validated at boundaries.

### 5.2 Architecture

- Domain logic is independent from React and Tauri.
- Schemas own runtime validation.
- Infrastructure implements domain ports.
- UI modules do not import SQLite or filesystem logic directly.
- Feature folders own their screen-specific UI and state.

### 5.3 UI fidelity

- Approved screen family is the visual source of truth.
- No gradients, glass, glow, neon, fake AI sparkles, charts, or gamification.
- Serif is reserved for main word and editorial headings.
- Sans-serif is used for controls and body UI.
- Burgundy is the single primary accent.
- SVG and CSS are preferred over bitmap assets.

### 5.4 Data safety

- Destructive actions require confirmation.
- Replacement never deletes independent user metadata.
- Restore uses validation and transaction boundaries.
- A failed migration or restore cannot leave the database half-updated.

### 5.5 No speculative work

No future module, abstraction, dependency, or state is added merely because it may be useful later. Every implementation must serve an approved V1 requirement or a current test need.

## 6. Definition of done for final V1

Final V1 is complete only when:

- all three routes are stable;
- the full unknown-word import loop works;
- local persistence survives restart;
- library management works at target scale;
- import/export and backup/restore pass round-trip tests;
- diagnostics and index rebuild work;
- keyboard and accessibility checks pass;
- production build and Windows installer pass;
- no forbidden provider or model integration exists;
- the approved visual system is consistently implemented;
- all locked checkpoint regression tests pass.
