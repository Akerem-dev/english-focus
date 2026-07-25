# Engineering Standards

These rules define the product, architecture, quality, and design boundaries for English Focus. They apply to every contribution regardless of tooling or implementation method.

## Product

- Vocabulary is the first module, not the permanent identity of the whole platform.
- Version 1 has exactly three primary navigation screens: Vocabulary, Library, and Settings.
- Search and vocabulary detail are states of the Vocabulary screen, not separate primary routes.
- AI runs outside the application. Do not add API providers, API keys, local models, retrieval pipelines, or chat interfaces.
- Do not add future learning modules or “Coming soon” screens before approved requirements exist.

## Data

- JSON-first data exchange is mandatory.
- Imported data is untrusted until parsing, schema validation, semantic validation, and quality checks complete.
- Generated content must never overwrite personal metadata such as notes, favorites, tags, or learning state.
- Core entries, user entries, user overrides, and personal metadata remain separate layers.
- Every persisted vocabulary payload must carry a schema version.

## Architecture

- UI components must not call SQLite, the filesystem, clipboard, backup, or Tauri commands directly.
- Application use cases coordinate domain ports.
- Infrastructure adapters implement domain ports.
- Domain code must not import React, Tauri, SQLite, filesystem, or browser APIs.
- Prefer readable, direct code over speculative factories and inheritance trees.

## TypeScript

- Keep strict mode enabled.
- Never introduce `any`.
- Parse external values as `unknown`.
- Do not suppress type or lint errors without a documented architectural reason.
- Use type-only imports where appropriate.

## Design

- Build an editorial language-learning tool, not an AI dashboard.
- Use design tokens only.
- Avoid gradients, glassmorphism, neon glow, decorative sparkles, fake confidence, streaks, XP, charts, and dashboard filler.
- Icons communicate actions rather than decorate headings.
- Do not turn every section into a card.
- Keep motion short, functional, and reduced-motion aware.

## Quality

- Every real workflow needs loading, empty, error, keyboard, offline, long-content, and narrow-window states.
- Make the smallest coherent change.
- Do not modify unrelated files.
- Run structure, forbidden-pattern, formatting, lint, typecheck, test, and build checks before completion.
