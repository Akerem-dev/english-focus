# Checkpoint CP05A

Status: TESTING

## Goal

Lock the V1 vocabulary content model, separate user metadata model, schema version, strict runtime Zod validation, and JSON Schema export.

## Acceptance gate

- TypeScript strict mode passes across every workspace.
- Domain contract tests pass.
- Vocabulary-entry schema tests pass.
- User-metadata schema tests pass.
- Schema-version detection tests pass.
- Existing CP04 application-shell tests remain green.
- Desktop production build remains green.
- No visible UI change is expected in this checkpoint.

## Next checkpoint

CP05B — canonical `maintain` fixture, test builders, and a validated read-only content source.
