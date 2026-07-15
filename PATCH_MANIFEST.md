# CP22 Patch Manifest

## Product behavior

- Activates the top-bar `Ctrl+K` control.
- Adds a searchable, keyboard-operable command bar.
- Adds route-aware commands for Vocabulary, Library, and Settings.
- Adds global shortcuts:
  - `Ctrl+K` command bar
  - `Ctrl+L` Library
  - `Ctrl+,` Settings
  - `Ctrl+I` import
  - `Ctrl+E` context export
  - `Ctrl+S` favorite/save
  - `/` focus search
  - `?` shortcut help
  - `Esc` close overlay
- Adds a keyboard shortcut reference dialog.
- Adds arrow-key and Enter command execution.
- Adds modal Tab focus containment and explicit autofocus support.
- Adds contextual command wiring to Vocabulary and Library.
- Keeps shortcuts inactive while typing in form controls.

## Safety boundaries

- No database or persistence changes.
- No network access.
- No API integration.
- No new primary route.
- Existing import/export, backup, settings, diagnostics, and metadata flows remain unchanged.
