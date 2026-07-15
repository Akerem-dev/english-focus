import type { BackupRepository, BackupRestoreResult } from "@platform/domain";

export function restoreBackup(
  repository: BackupRepository,
  fileName: string,
  restoredAt = new Date().toISOString()
): Promise<BackupRestoreResult> {
  return repository.restoreBackup(fileName, restoredAt);
}
