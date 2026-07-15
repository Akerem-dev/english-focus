import type { BackupDescriptor } from "./BackupDescriptor";

export interface RestorePlan {
  readonly backup: BackupDescriptor;
  readonly createsSafetyBackup: true;
  readonly replacesVocabularyEntries: boolean;
  readonly replacesVocabularyMetadata: boolean;
  readonly replacesSettings: boolean;
}
