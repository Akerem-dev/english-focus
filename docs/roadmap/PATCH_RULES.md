# Patch Packaging Rules

## 1. Root-relative structure

A patch is copied directly into the project root. It must not contain an extra wrapper folder.

Correct:

```text
apps/
packages/
docs/
PATCH_MANIFEST.md
DELETE_FILES.txt
```

Incorrect:

```text
english-focus-part-01/
  english-learning-platform-final-skeleton/
    apps/
```

## 2. Required patch documents

Every patch contains:

- `PATCH_MANIFEST.md`
- `CHECKPOINT.md`
- `DELETE_FILES.txt`
- `TEST_PLAN.md` when any test is required

`PATCH_MANIFEST.md` records:

- patch identifier;
- purpose;
- files added;
- files changed;
- files deleted;
- dependency changes;
- risks;
- rollback instructions.

## 3. Deletions and renames

ZIP extraction cannot delete old files.

When a file must be deleted, its root-relative path is listed in `DELETE_FILES.txt`.

A rename is represented as:

1. add the new file;
2. list the old path in `DELETE_FILES.txt`.

No wildcard deletion is permitted.

## 4. Dependency rules

- Do not ship `node_modules`.
- Do not ship npm cache files.
- Do not ship a lockfile generated against a private or internal registry.
- Prefer generating the first trusted lockfile on the user's machine.
- Once a trusted public-registry lockfile is established and locked, later dependency patches may include it.
- Every dependency addition must be justified in the manifest.
- Avoid dependencies for behavior that can be implemented clearly with existing platform APIs.

## 5. Registry safety

The only approved npm registry for this project is:

```text
https://registry.npmjs.org/
```

Patches must be scanned for:

- `applied-caas`;
- `internal.api.openai.org`;
- unexpected `registry=` values;
- machine-specific proxy values.

## 6. File-count rule

Patch cohesion determines file count.

- Small configuration changes should remain under 12 files.
- Small features generally remain under 18 files.
- Medium vertical slices generally remain under 30 files.
- A larger patch requires an explicit explanation.

Do not split one compile-dependent feature merely to hit an arbitrary file count. Do not combine unrelated features merely to reduce the number of deliveries.

## 7. No unrelated modifications

A patch must not:

- reformat untouched modules;
- rename unrelated files;
- change architecture boundaries without roadmap approval;
- alter locked visual behavior without listing regression tests;
- add future-module placeholders to the interface.

## 8. Rollback

Before applying a patch, the user should either:

- keep the previous project folder copy; or
- use source control and commit the locked checkpoint.

Rollback is performed by restoring the last locked checkpoint and then applying a corrected patch.

## 9. Patch naming

Recommended names:

```text
english-focus-part00a-roadmap-patch.zip
english-focus-part01a-environment-patch.zip
english-focus-cp01-fix01-registry-patch.zip
english-focus-part02c-app-shell-checkpoint.zip
```

Names must identify phase/part or checkpoint and purpose.

## 10. Security and privacy

Patch archives must not contain:

- `.env` with real values;
- API keys;
- personal file paths;
- personal vocabulary data unless supplied explicitly for that purpose;
- diagnostic logs containing secrets;
- generated certificates or signing keys.
