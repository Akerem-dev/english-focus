import type {
  BackupDescriptor,
  BackupReason,
  BackupRestoreResult,
  BackupValidationResult,
  UnavailableBackup
} from "../backup";

export interface BackupRepository {
  listBackups(): Promise<readonly BackupDescriptor[]>;
  listUnavailableBackups(): Promise<readonly UnavailableBackup[]>;
  createBackup(reason: BackupReason, createdAt: string): Promise<BackupDescriptor>;
  validateBackup(fileName: string): Promise<BackupValidationResult>;
  restoreBackup(fileName: string, restoredAt: string): Promise<BackupRestoreResult>;
  deleteBackup(fileName: string): Promise<void>;
  deleteUnavailableBackup(fileName: string): Promise<void>;
}
