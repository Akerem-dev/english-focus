import type { LocalDataCategory, LocalDataSnapshot } from "@platform/domain";

export const FULL_LOCAL_RESET_CATEGORIES: readonly LocalDataCategory[] = Object.freeze([
  "study-metadata",
  "user-vocabulary",
  "overrides",
  "settings",
  "activity"
]);

export function requiredLocalDataConfirmation(
  categories: readonly LocalDataCategory[]
): "DELETE BACKUPS" | "DELETE SELECTED DATA" | "RESET LOCAL DATA" {
  if (categories.includes("backups")) {
    return categories.length === 1 ? "DELETE BACKUPS" : "RESET LOCAL DATA";
  }

  const isFullReset = FULL_LOCAL_RESET_CATEGORIES.every((category) =>
    categories.includes(category)
  );
  return isFullReset ? "RESET LOCAL DATA" : "DELETE SELECTED DATA";
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
