import { createContext } from "react";
import type {
  BackupDescriptor,
  BackupRestoreResult,
  BackupValidationResult
} from "@platform/domain";

export type BackupStatus =
  "loading" | "ready" | "creating" | "validating" | "restoring" | "deleting" | "error";

export interface BackupContextValue {
  readonly backups: readonly BackupDescriptor[];
  readonly status: BackupStatus;
  readonly error?: string | undefined;
  readonly lastRestore?: BackupRestoreResult | undefined;
  readonly refreshBackups: () => Promise<readonly BackupDescriptor[]>;
  readonly createManualBackup: () => Promise<BackupDescriptor>;
  readonly validateBackup: (fileName: string) => Promise<BackupValidationResult>;
  readonly restoreBackup: (fileName: string) => Promise<BackupRestoreResult>;
  readonly deleteBackup: (fileName: string) => Promise<void>;
  readonly clearLastRestore: () => void;
}

export const BackupContext = createContext<BackupContextValue | undefined>(undefined);
