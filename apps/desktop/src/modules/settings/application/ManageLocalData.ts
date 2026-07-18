import type { LocalDataCategory, LocalDataSnapshot } from "@platform/domain";

export const FULL_LOCAL_RESET_CATEGORIES: readonly LocalDataCategory[] = Object.freeze([
  "study-metadata",
  "user-vocabulary",
  "overrides",
  "settings",
  "activity"
]);

export const RESET_APPLICATION_CONFIRMATION = "RESET ENGLISH FOCUS";

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
