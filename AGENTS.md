# Permanent Engineering Rules

## Product
- Vocabulary is the first module, not the permanent identity of the whole platform.
- Final V1 has exactly three primary navigation screens: Vocabulary, Library, Settings.
- Search and vocabulary detail are states of the Vocabulary screen, not separate primary routes.
- AI runs outside the app. Do not add API providers, API keys, Ollama, local models, RAG, or chat UI.
- Do not add future learning modules or “Coming soon” screens before approved requirements exist.

## Data
- JSON-first is mandatory.
- Imported data is untrusted until parse, schema, semantic, and quality validation complete.
- AI-generated content must never overwrite user metadata such as notes, favorite state, tags, or learning status.
- Core entries, user entries, user overrides, and user metadata are separate layers.
- Every persisted vocabulary payload must carry a schema version.

## Architecture
- UI components cannot call SQLite, filesystem, clipboard, backup, or Tauri commands directly.
- Application use cases coordinate domain ports.
- Infrastructure implements domain ports.
- Domain code imports no React, Tauri, SQLite, filesystem, or browser APIs.
- Prefer readable direct code over speculative factories and inheritance trees.

## TypeScript
- Keep strict mode enabled.
- Never introduce `any`.
- Parse external values as `unknown`.
- Do not suppress type or lint errors without a documented architectural reason.
- Use type-only imports when appropriate.

## Design
- Editorial language-learning tool, not an AI dashboard.
- Use design tokens only.
- No gradients, glassmorphism, neon glow, AI sparkles, fake confidence, streaks, XP, charts, or dashboard filler.
- Icons communicate actions, not decorate headings.
- Do not make every section a card.
- All motion is short, functional, and reduced-motion aware.

## Quality
- Every real workflow needs loading, empty, error, keyboard, offline, long-content, and narrow-window states.
- Make the smallest coherent change.
- Do not modify unrelated files.
- Run structure, forbidden-pattern, format, lint, typecheck, tests, and build checks before completion.
