import type {
  LocalDataCategory,
  LocalDataSnapshot,
  ResetLocalDataResult
} from "@platform/domain";

export const FULL_LOCAL_RESET_CATEGORIES: readonly LocalDataCategory[] = Object.freeze([
  "study-metadata",
  "user-vocabulary",
  "overrides",
  "settings",
  "activity"
]);

export const RESET_APPLICATION_CONFIRMATION = "RESET ENGLISH FOCUS";

export interface LocalDataResetPresentation {
  readonly resultMessage: string;
  readonly toastMessage: string;
  readonly toastTone: "success" | "warning";
  readonly refreshIncomplete: boolean;
}

export function isFullResetConfirmation(value: string): boolean {
  return value.trim() === RESET_APPLICATION_CONFIRMATION;
}

export function canCreateSafetyBackup(categories: readonly LocalDataCategory[]): boolean {
  return (
    !categories.includes("backups") &&
    categories.some((category) =>
      ["study-metadata", "user-vocabulary", "overrides", "settings"].includes(category)
    )
  );
}

export function selectedLocalDataCount(
  snapshot: LocalDataSnapshot,
  categories: readonly LocalDataCategory[]
): number {
  return categories.reduce((total, category) => {
    switch (category) {
      case "study-metadata":
        return total + snapshot.studyMetadataRecords;
      case "user-vocabulary":
        return total + snapshot.userVocabularyEntries;
      case "overrides":
        return total + snapshot.overrideVocabularyEntries;
      case "settings":
        return total + snapshot.settingsRecords;
      case "activity":
        return total + snapshot.activityRecords;
      case "backups":
        return total + snapshot.backupFiles;
    }
  }, 0);
}

function deletedLocalDataCount(result: ResetLocalDataResult): number {
  const deleted = result.deleted;
  return (
    deleted.studyMetadataRecords +
    deleted.userVocabularyEntries +
    deleted.overrideVocabularyEntries +
    deleted.settingsRecords +
    deleted.activityRecords +
    deleted.backupFiles
  );
}

export function presentLocalDataResetResult(
  result: ResetLocalDataResult,
  refreshIncomplete: boolean
): LocalDataResetPresentation {
  const deletedCount = deletedLocalDataCount(result);
  const deletedLabel = `${deletedCount} ${deletedCount === 1 ? "item" : "items"} removed.`;
  const recoveryLabel =
    result.safetyBackup === undefined
      ? "No recovery copy was created."
      : "A recovery copy was created first.";
  const backupFailureCount = result.backupDeletion.failedFiles;
  const backupWarning =
    backupFailureCount === 0
      ? undefined
      : `${backupFailureCount} saved ${backupFailureCount === 1 ? "backup" : "backups"} could not be removed.`;
  const refreshWarning = refreshIncomplete
    ? "The removal finished, but some on-screen totals could not refresh yet."
    : undefined;
  const warnings = [backupWarning, refreshWarning].filter(
    (message): message is string => message !== undefined
  );

  return Object.freeze({
    resultMessage: [deletedLabel, recoveryLabel, ...warnings].join(" "),
    toastMessage:
      warnings.length === 0
        ? `${deletedLabel} ${recoveryLabel}`
        : `${deletedLabel} ${warnings.join(" ")}`,
    toastTone: warnings.length === 0 ? "success" : "warning",
    refreshIncomplete
  });
}
