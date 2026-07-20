export type BackupReason = "manual" | "automatic" | "pre-restore";

export interface BackupCounts {
  readonly vocabularyEntries: number;
  readonly vocabularyMetadata: number;
  readonly settingsRecords: number;
}

export interface BackupDescriptor {
  readonly fileName: string;
  readonly createdAt: string;
  readonly reason: BackupReason;
  readonly sizeBytes: number;
  readonly backupVersion: "1.0.0";
  readonly databaseSchemaVersion: "2" | "3";
  readonly checksum: string;
  readonly counts: BackupCounts;
}

export interface UnavailableBackup {
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly issue: string;
}

export interface BackupValidationResult {
  readonly valid: boolean;
  readonly issues: readonly string[];
  readonly descriptor?: BackupDescriptor | undefined;
}

export interface BackupRestoreResult {
  readonly restoredAt: string;
  readonly restored: BackupCounts;
  readonly sourceBackup: BackupDescriptor;
  readonly safetyBackup: BackupDescriptor;
}
