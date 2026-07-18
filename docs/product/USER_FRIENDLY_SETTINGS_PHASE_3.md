# User-friendly Settings — Phase 3

## Goal

Make backup management and recent activity shorter, calmer, and focused on one user decision at a time.

## Backup management

- Backup date is the primary list label.
- Type, size, and a short contents summary remain visible.
- File name, backup version, and storage format move behind Technical details.
- Statistic cards are replaced by three plain summary rows.
- Validation appears as a short readiness message.
- Restore confirmation appears only after a backup passes its check.
- Deletion uses a small inline review instead of a permanently visible danger zone.
- Restore, validation, recovery-copy, and deletion behavior are unchanged.

## Recent activity

- The count is plain text instead of a status badge.
- Activity rows use dividers rather than individual cards.
- Scope is shown as quiet metadata instead of a chip.
- Older incompatible records show a concise explanation; raw output remains closed under Technical details.
- Clearing activity uses an explicit inline review with Cancel and Clear activity actions instead of a persistent checkbox panel.
- Activity storage and clearing behavior are unchanged.

## Visual boundary

The surfaces avoid nested cards, decorative metrics, glowing markers, repeated warning panels, gradients, glass effects, and synthetic dashboard styling. Hierarchy comes from typography, spacing, and dividers.

## Safety boundary

- No SQLite schema or migration changes
- No backup format changes
- No restore, validation, deletion, or retention changes
- No activity persistence changes
- No vocabulary data changes
