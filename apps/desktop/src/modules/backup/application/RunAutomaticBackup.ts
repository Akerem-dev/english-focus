import type { BackupDescriptor, BackupFrequency, BackupReason } from "@platform/domain";

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

export function automaticBackupDelayMs(
  backups: readonly BackupDescriptor[],
  frequency: BackupFrequency,
  now: Date
): number | undefined {
  const interval = intervalForFrequency(frequency);

  if (interval === undefined) {
    return undefined;
  }

  const latestAutomatic = backups
    .filter((backup) => backup.reason === "automatic")
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

  if (latestAutomatic === undefined) {
    return 0;
  }

  const latestTime = Date.parse(latestAutomatic.createdAt);
  if (Number.isNaN(latestTime)) {
    return 0;
  }

  return Math.max(0, latestTime + interval - now.getTime());
}

export function isAutomaticBackupDue(
  backups: readonly BackupDescriptor[],
  frequency: BackupFrequency,
  now: Date
): boolean {
  return automaticBackupDelayMs(backups, frequency, now) === 0;
}

export function automaticBackupRetryDelayMs(failureCount: number): number {
  if (failureCount <= 1) {
    return 60_000;
  }

  if (failureCount === 2) {
    return 5 * 60_000;
  }

  if (failureCount === 3) {
    return 15 * 60_000;
  }

  return 60 * 60_000;
}

export function findCreatedBackup(
  backups: readonly BackupDescriptor[],
  reason: BackupReason,
  createdAt: string
): BackupDescriptor | undefined {
  return backups.find((backup) => backup.reason === reason && backup.createdAt === createdAt);
}
