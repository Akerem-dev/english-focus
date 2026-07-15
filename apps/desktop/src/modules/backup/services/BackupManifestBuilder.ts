import type { BackupDescriptor } from "@platform/domain";

export function describeBackup(backup: BackupDescriptor): string {
  const reason = backup.reason === "pre-restore" ? "Safety backup" : `${backup.reason} backup`;
  return `${reason} · ${backup.counts.vocabularyEntries} entries · ${backup.counts.vocabularyMetadata} metadata records`;
}
