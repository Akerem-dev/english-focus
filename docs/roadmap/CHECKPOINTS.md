# Checkpoint Registry

## Status vocabulary

- `PLANNED`: Defined but not started.
- `IN_PROGRESS`: Current implementation target.
- `TESTING`: Patch delivered and awaiting user verification.
- `BLOCKED`: Cannot continue until a specific issue is fixed.
- `LOCKED`: Passed automated, functional, and visual checks.
- `REOPENED`: Previously locked checkpoint requires a controlled regression fix.

## Checkpoint table

| ID | Name | Main proof | User must test | Initial status |
|---|---|---|---|---|
| CP00 | Roadmap baseline | Planning documents copied without source changes | Confirm file placement | TESTING |
| CP01 | Dependency installation | Public npm install succeeds | Yes | PLANNED |
| CP02 | Browser runtime | Minimal React app opens in browser | Yes | PLANNED |
| CP03 | Native runtime | Tauri window opens on Windows | Yes | PLANNED |
| CP04 | Visual shell | Three routes and responsive shell | Yes, functional + visual | PLANNED |
| CP05 | Domain and fixture | Schemas accept valid fixture and reject invalid cases | Automated output review | PLANNED |
| CP06 | Read-only vocabulary | Full maintain entry renders | Yes, visual + content | PLANNED |
| CP07 | Search vertical slice | Exact, normalized, inflected, unknown, invalid states | Yes | PLANNED |
| CP08 | Copyable instruction | Unknown word instruction copied correctly | Yes | PLANNED |
| CP09 | Validation workflow | Invalid JSON yields actionable issues | Yes | PLANNED |
| CP10 | In-memory full loop | Unknown word becomes searchable after import | Yes | PLANNED |
| CP11 | Persistent search | Imported data survives restart | Yes | PLANNED |
| CP12 | Library management | Search/filter/sort/metadata/bulk operations | Yes | PLANNED |
| CP13 | Import/export | Single and pack round trips | Yes | PLANNED |
| CP14 | Data safety | Backup/restore/retention and clear-data flows | Yes | PLANNED |
| CP15 | Productivity | Command bar, shortcuts, undo, diagnostics | Yes | PLANNED |
| CP16 | Release candidate | Accessibility, performance, build, installer | Yes | PLANNED |
| CP17 | Content release | Validated core vocabulary pack | Sampling + automated review | PLANNED |

## Locking procedure

A checkpoint is locked in this order:

1. Assistant validates patch structure on a clean skeleton copy.
2. Assistant runs available automated checks.
3. User applies patch to the real project.
4. User runs the checkpoint's exact commands.
5. User performs listed functional tests.
6. User performs visual tests when applicable.
7. Any failure produces a same-checkpoint fix patch.
8. User reruns failed tests and required regressions.
9. `PROJECT_STATUS.md` is updated to `LOCKED` in the next patch.

## Failure policy

When a checkpoint fails:

- do not apply a later part;
- preserve terminal output and screenshot;
- identify whether failure is environment, dependency, compile, runtime, functional, data, or visual;
- fix the smallest possible surface;
- name fixes sequentially, such as `cp01-fix01`, `cp01-fix02`;
- do not silently change roadmap scope during a fix.

## Regression policy

Each locked checkpoint contributes tests to the permanent regression suite.

Examples:

- After CP04, every future checkpoint rechecks three-route navigation.
- After CP07, every future search-related checkpoint rechecks normalization cases.
- After CP11, every persistence change rechecks restart survival.
- After CP14, every database change rechecks backup/restore round-trip.

## User report template

```text
Checkpoint:
Patch name:
Windows version:
Node version:
npm version:

Installation: PASS / FAIL
Automated checks: PASS / FAIL
Desktop launch: PASS / FAIL
Functional test: PASS / FAIL
Visual test: PASS / FAIL / NOT REQUIRED

Expected:
Actual:
Reproduction steps:
Terminal output:
Screenshot:
Additional notes:
```
