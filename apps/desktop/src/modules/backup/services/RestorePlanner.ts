import type { BackupDescriptor, RestorePlan } from "@platform/domain";

export function createRestorePlan(backup: BackupDescriptor): RestorePlan {
  return Object.freeze({
    backup,
    createsSafetyBackup: true,
    replacesVocabularyEntries: true,
    replacesVocabularyMetadata: true,
    replacesSettings: backup.counts.settingsRecords > 0
  });
}
