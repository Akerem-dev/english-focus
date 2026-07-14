# Test Plan — CP04C Application Shell

## Automated checks

Run from the repository root:

```powershell
npm run check:environment
npm run typecheck
npm run test --workspace=@app/desktop
npm run build --workspace=@app/desktop
```

Expected new route tests: four passing tests. Existing future-feature tests remain skipped.

## Native test

```powershell
npm run desktop
```

### Vocabulary

- Vocabulary is selected on launch.
- The page shows `Look up an English word`.
- Typing and clearing the search field works.
- Search submission does not navigate or crash; repository search is intentionally deferred.
- Recent-search and recent-addition cards remain aligned.

### Library

- Select Library in the sidebar.
- URL hash becomes `#/library`.
- Active sidebar state moves to Library.
- Empty state and `0 entries` appear.
- Disabled actions do not fire.

### Settings

- Select Settings in the sidebar.
- URL hash becomes `#/settings`.
- Active sidebar state moves to Settings.
- Content, Data, Appearance & accessibility, and Diagnostics panels appear.
- Switches and selects respond locally without crashes.
- Refreshing the app may reset them; persistence is deferred.

### Responsive behavior

- At normal width the EF name and navigation labels are visible.
- Near 960 px the sidebar becomes icon-only.
- Tooltip/title text identifies icon-only navigation items.
- No horizontal scrollbar appears.
- Route content remains vertically scrollable.

### Accessibility

- Tab reaches all three navigation items.
- Enter activates the focused route.
- Focus rings are visible.
- The skip-to-content link appears when focused.

## Git

Do not commit until this checkpoint is approved.
