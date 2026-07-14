# Patch manifest — Part 02B

## Purpose

Create a safe Git/GitHub baseline from the verified CP03 native desktop checkpoint before beginning CP04.

## Added

- `.gitattributes`
- `docs/development/GIT_WORKFLOW.md`
- `scripts/check-git-hygiene.mjs`

## Replaced

- `.gitignore`
- `package.json`
- `CHECKPOINT.md`
- `PROJECT_STATUS.md`
- `PATCH_MANIFEST.md`
- `TEST_PLAN.md`
- `DELETE_FILES.txt`

## Dependencies

None added or removed. `package-lock.json` and `node_modules` must remain unchanged.

## Product behavior

No UI, Tauri, routing, domain, storage, or feature behavior changes.
