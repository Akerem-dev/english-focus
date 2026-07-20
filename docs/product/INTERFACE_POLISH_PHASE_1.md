# Interface polish and friendly errors — Phase 1

Status: implemented on `feat/interface-polish-and-friendly-errors`

## Scope

This phase removes technical storage terminology from everyday vocabulary screens and gives About this app a quieter, more deliberate information hierarchy.

## Completed

- Removed the `Creates local override` badge from the vocabulary editor.
- Removed the bundled-record implementation note that accompanied the badge.
- Kept the underlying override save behavior unchanged.
- Removed the `SQLite · local only` badge and Storage row from personal details.
- Reduced the personal-details activity footer to Views and Last viewed.
- Placed English Focus, version, and local storage information directly beneath About this app.
- Kept version details available as a secondary disclosure.
- Added component coverage to prevent technical storage labels from returning.

## Design boundary

The work removes explanatory chips that describe implementation rather than user intent. It relies on plain hierarchy, spacing, and alignment rather than decorative badges, nested cards, or generic AI-generated admin-panel patterns.

## Safety boundary

- No vocabulary persistence changes.
- No override behavior changes.
- No metadata schema changes.
- No SQLite schema changes.
- No settings migrations.

## Next phase

Phase 2 will correct Library row alignment, place the level value directly beneath its column heading, and replace the conventional B2 chip treatment with a quieter typographic level marker.
