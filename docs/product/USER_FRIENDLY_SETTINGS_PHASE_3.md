# User-friendly Settings — Phase 3

Phase 3 simplifies the two task-heavy Settings experiences: backups and recent activity.

## Backup flow

- The dialog now starts with one primary action: check the selected backup.
- Restore appears only after the backup passes its local check.
- Backup contents use three plain rows instead of statistic cards.
- File names, backup versions, storage formats, and deletion are grouped under More options.
- The selected backup area is separated with whitespace and dividers instead of a nested inspector card.
- Backup list entries are flat rows rather than separate floating cards.

## Recent activity

- The repeated Recent activity heading is removed inside the focused management screen.
- The count is plain text instead of a status chip.
- Activity entries are flat timeline rows with dividers.
- Scope is plain supporting text instead of a badge.
- Clear activity is an explicit task button.
- The confirmation controls appear only after the user chooses Clear activity.
- Older-record errors remain readable, with raw details collapsed.

## Safety boundary

This phase does not change:

- backup creation, validation, restore, or deletion behavior;
- restore confirmation requirements;
- activity storage, filtering, or clearing behavior;
- SQLite schemas, backup formats, or settings migrations;
- vocabulary data.

## Visual direction

The task flows avoid nested panels, dashboard metrics, decorative badges, gradients, glass surfaces, and permanently visible destructive controls. Hierarchy comes from typography, spacing, dividers, and progressive disclosure.
