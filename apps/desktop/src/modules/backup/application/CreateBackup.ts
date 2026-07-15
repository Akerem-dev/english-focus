import type { BackupDescriptor, BackupReason, BackupRepository } from "@platform/domain";

export function createBackup(
  repository: BackupRepository,
  reason: BackupReason,
  createdAt = new Date().toISOString()
): Promise<BackupDescriptor> {
  return repository.createBackup(reason, createdAt);
}
