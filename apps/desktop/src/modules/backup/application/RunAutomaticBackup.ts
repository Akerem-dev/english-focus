import type { BackupDescriptor, BackupFrequency } from "@platform/domain";

const DAY_MS = 24 * 60 * 60 * 1_000;

function intervalForFrequency(frequency: BackupFrequency): number | undefined {
  if (frequency === "daily") {
    return DAY_MS;
  }

  if (frequency === "weekly") {
    return DAY_MS * 7;
  }

  return undefined;
}

export function isAutomaticBackupDue(
  backups: readonly BackupDescriptor[],
  frequency: BackupFrequency,
  now: Date
): boolean {
  const interval = intervalForFrequency(frequency);

  if (interval === undefined) {
    return false;
  }

  const latestAutomatic = backups
    .filter((backup) => backup.reason === "automatic")
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

  if (latestAutomatic === undefined) {
    return true;
  }

  const latestTime = Date.parse(latestAutomatic.createdAt);
  return Number.isNaN(latestTime) || now.getTime() - latestTime >= interval;
}
