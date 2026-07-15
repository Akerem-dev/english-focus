import type { BackupDescriptor } from "../backup";

export const LOCAL_DATA_CATEGORIES = [
  "study-metadata",
  "user-vocabulary",
  "overrides",
  "settings",
  "activity",
  "backups"
] as const;

export type LocalDataCategory = (typeof LOCAL_DATA_CATEGORIES)[number];

export interface LocalDataSnapshot {
  readonly studyMetadataRecords: number;
  readonly userVocabularyEntries: number;
  readonly overrideVocabularyEntries: number;
  readonly settingsRecords: number;
  readonly activityRecords: number;
  readonly backupFiles: number;
}

export interface ResetLocalDataInput {
  readonly categories: readonly LocalDataCategory[];
  readonly createSafetyBackup: boolean;
  readonly requestedAt: string;
}

export interface ResetLocalDataResult {
  readonly deleted: LocalDataSnapshot;
  readonly safetyBackup?: BackupDescriptor | undefined;
}
