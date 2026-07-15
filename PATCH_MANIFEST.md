# Patch Manifest — CP24 Local Activity & Privacy

Package type: project-root overlay patch  
Required baseline: locked CP23 `cp23/toast-feedback-undo`

## Added

- activity domain contract and repository port;
- strict activity Zod schema;
- Tauri activity repository;
- React activity provider and event bus;
- SQLite activity commands and bounded retention;
- Settings → Privacy & activity workspace;
- activity filtering, empty/error states, and explicit clear confirmation;
- activity presentation and schema tests.

## Updated

- SQLite schema version 2 → 3;
- diagnostics required-table and schema-version checks;
- backup descriptors to create schema-3 backups while accepting legacy schema-2 backups;
- vocabulary view, toast feedback, settings, backup, and diagnostics actions to publish safe activity events;
- Settings layout so Diagnostics and Privacy & activity remain full-width.

## Explicitly unchanged

- exactly three routes: Vocabulary, Library, Settings;
- vocabulary content and user metadata;
- external-AI JSON workflow;
- package dependencies and lockfile;
- backup payload contents;
- network policy.

## Installation

Copy the archive contents into the project root and replace matching files.

Do not run `npm install`, delete `node_modules`, delete `package-lock.json`, or reapply CP23.
