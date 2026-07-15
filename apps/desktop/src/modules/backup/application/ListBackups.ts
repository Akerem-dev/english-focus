import type { BackupDescriptor } from "@platform/domain";

export function sortBackupsNewestFirst(
  backups: readonly BackupDescriptor[]
): readonly BackupDescriptor[] {
  return Object.freeze(
    [...backups].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  );
}
