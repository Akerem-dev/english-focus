# CP11 Patch Manifest

## Patch type

Incremental project-root overlay for branch `cp11/content-validation`.

## Product changes

1. Runs semantic checks only after the strict vocabulary schema passes.
2. Blocks mismatched target words, inconsistent normalization, invalid external-import provenance, broken bilingual pairs, duplicate/self-referential content, target-free examples, and impossible timestamp ordering.
3. Runs advisory quality inspection separately from blocking validation.
4. Shows semantic errors and quality warnings in a dedicated result dialog.
5. Reuses the provider-independent correction instruction for schema, semantic, and quality issues.
6. Keeps preview and persistence disabled for the next checkpoints.

## Safety

- No API, provider, endpoint, or network integration
- No new npm or Rust dependencies
- No `package-lock.json` replacement
- No persistence mutation
- No files deleted
