import type { ActivityKind, ActivityScope } from "@platform/domain";

export function activityKindLabel(kind: ActivityKind): string {
  switch (kind) {
    case "vocabulary-viewed":
      return "Vocabulary viewed";
    case "favorite-changed":
      return "Favorite changed";
    case "study-details-saved":
      return "Study details saved";
    case "vocabulary-saved":
      return "Vocabulary saved";
    case "entry-kept":
      return "Existing entry kept";
    case "export-created":
      return "Local export created";
    case "clipboard-copied":
      return "Copied to clipboard";
    case "settings-updated":
      return "Settings updated";
    case "backup-created":
      return "Backup created";
    case "backup-restored":
      return "Backup restored";
    case "backup-deleted":
      return "Backup deleted";
    case "diagnostics-run":
      return "Diagnostics run";
    case "local-data-reset":
      return "Local data removed";
    case "operation-warning":
      return "Operation warning";
    case "operation-failed":
      return "Operation failed";
  }
}

export function activityScopeLabel(scope: ActivityScope): string {
  switch (scope) {
    case "vocabulary":
      return "Vocabulary";
    case "library":
      return "Library";
    case "settings":
      return "Settings";
    case "backup":
      return "Backup";
    case "system":
      return "System";
  }
}

export function formatActivityTime(isoTimestamp: string, now = new Date()): string {
  const value = new Date(isoTimestamp);
  if (Number.isNaN(value.getTime())) {
    return "Unknown time";
  }

  const difference = Math.max(0, now.getTime() - value.getTime());
  const minutes = Math.floor(difference / 60_000);

  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hr ago`;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}
