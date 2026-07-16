export const activityKinds = [
  "vocabulary-viewed",
  "favorite-changed",
  "study-details-saved",
  "vocabulary-saved",
  "entry-kept",
  "export-created",
  "clipboard-copied",
  "settings-updated",
  "backup-created",
  "backup-restored",
  "backup-deleted",
  "diagnostics-run",
  "local-data-reset",
  "operation-warning",
  "operation-failed"
] as const;

export type ActivityKind = (typeof activityKinds)[number];

export const activityScopes = ["vocabulary", "library", "settings", "backup", "system"] as const;

export type ActivityScope = (typeof activityScopes)[number];

export interface ActivityRecord {
  readonly id: string;
  readonly kind: ActivityKind;
  readonly scope: ActivityScope;
  readonly label: string;
  readonly target?: string | undefined;
  readonly occurredAt: string;
}

export type RecordActivityInput = ActivityRecord;

export type ActivityFilter = "all" | ActivityScope;
