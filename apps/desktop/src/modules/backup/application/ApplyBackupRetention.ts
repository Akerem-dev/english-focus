import type { BackupDescriptor, BackupRetentionPolicy, BackupReason } from "@platform/domain";
import { defaultBackupRetentionPolicy } from "@platform/domain";

function excessForReason(
  backups: readonly BackupDescriptor[],
  reason: BackupReason,
  limit: number
): readonly BackupDescriptor[] {
  return [...backups]
    .filter((backup) => backup.reason === reason)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(limit);
}

export function selectBackupsForRetentionDeletion(
  backups: readonly BackupDescriptor[],
  policy: BackupRetentionPolicy = defaultBackupRetentionPolicy
): readonly BackupDescriptor[] {
  const candidates = [
    ...excessForReason(backups, "automatic", policy.automaticLimit),
    ...excessForReason(backups, "pre-restore", policy.preRestoreLimit)
  ];

  return Object.freeze(
    candidates.filter((backup) => !policy.protectedReasons.includes(backup.reason))
  );
}
