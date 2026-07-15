import type { BackupRepository } from "@platform/domain";

export function deleteBackup(repository: BackupRepository, fileName: string): Promise<void> {
  return repository.deleteBackup(fileName);
}
