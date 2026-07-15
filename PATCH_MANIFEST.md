# CP10 Patch Manifest

## Patch type

Incremental project-root overlay for branch `cp10/schema-validation`.

## Product changes

1. Validates parsed objects with `vocabularyEntrySchema`.
2. Converts Zod issues into stable `ImportIssue` records.
3. Formats paths such as `meanings[0].definitionEn` and `grammar.patterns[2].explanationTr`.
4. Shows a dedicated validation-result dialog.
5. Builds a deterministic correction instruction from the original JSON, issue list, and required JSON Schema.
6. Copies correction text locally without API or network integration.

## Files

- 22 product/test files added or modified
- 7 checkpoint/documentation files added or replaced
- 0 files deleted
- 0 dependencies added
- `package-lock.json` is intentionally not included
