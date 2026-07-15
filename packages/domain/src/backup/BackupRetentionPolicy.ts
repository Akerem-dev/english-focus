import type { BackupReason } from "./BackupDescriptor";

export interface BackupRetentionPolicy {
  readonly automaticLimit: number;
  readonly preRestoreLimit: number;
  readonly protectedReasons: readonly BackupReason[];
}

export const defaultBackupRetentionPolicy: BackupRetentionPolicy = Object.freeze({
  automaticLimit: 7,
  preRestoreLimit: 5,
  protectedReasons: Object.freeze(["manual"] as const)
});
