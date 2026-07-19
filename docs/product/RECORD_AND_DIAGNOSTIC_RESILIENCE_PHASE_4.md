# Local record and diagnostic resilience — Phase 4

## Goal

A single malformed local row must not make every valid vocabulary or recent-activity record unavailable. Diagnostics must also distinguish a completed scan with zero findings from a scan that could not be completed.

## Resilient reads

Vocabulary and recent activity are decoded one record at a time at both the native and TypeScript boundaries.

- Valid records remain available when another row is malformed.
- Unsupported vocabulary storage layers are ignored during list loading.
- Invalid activity kinds, scopes, labels, targets, and timestamps are ignored during list loading.
- A malformed bridge response still fails explicitly instead of pretending the list is empty.
- Save and single-record responses remain strict; malformed writes are never accepted silently.

The original rows are not deleted or rewritten by this read path. Recovery remains an explicit user action.

## Diagnostic coverage

The normal report is accompanied by a separate coverage scan for:

- vocabulary records;
- favorites, tags, and notes;
- app settings;
- recent activity;
- the local backup directory.

When any of these scans cannot finish:

- the report is forced to `critical`;
- a failed `Diagnostic coverage` check is added;
- a healthy/no-action recommendation is removed;
- the user is directed to restart the app, run the check again, and validate a recent backup before changing local data.

No failed scan is converted into a zero count.

## Verification boundary

The standard Quality workflow now includes a Windows native-test job in addition to the existing JavaScript quality job. The native job compiles the Tauri crate and runs Rust tests on every pull request. When it fails, the focused Cargo output is retained briefly as a downloadable workflow artifact.
