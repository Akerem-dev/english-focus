# CP04C — Application Shell Foundation

## Scope

This checkpoint replaces the temporary component showcase with the persistent English Focus product shell.

The application now owns exactly three primary routes:

1. Vocabulary — `#/`
2. Library — `#/library`
3. Settings — `#/settings`

Search results, word details, import workflows, validation results, dialogs, and backup progress remain states or overlays inside these routes. They are not additional primary navigation destinations.

## Delivered

- Hash-based routing compatible with the native Tauri webview.
- Persistent EF brand sidebar.
- Active-route navigation with keyboard focus behavior.
- Compact icon-only sidebar below the narrow breakpoint.
- Persistent route-aware top bar.
- Native runtime status indicator.
- Initial Vocabulary shell state.
- Empty Library shell state.
- Settings layout foundation.
- Skip-to-content accessibility link.
- Route contract tests.

## Explicitly deferred

- Vocabulary repository search and result states.
- Command bar and keyboard shortcut execution.
- JSON import behavior.
- Settings persistence.
- SQLite initialization.
- Library filtering and selection.

The disabled Import and empty-Library actions are intentional until their owning checkpoints are implemented.
