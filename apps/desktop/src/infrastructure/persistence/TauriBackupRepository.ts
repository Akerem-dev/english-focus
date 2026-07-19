import { invoke } from "@tauri-apps/api/core";
import type {
  BackupDescriptor,
  BackupReason,
  BackupRepository,
  BackupRestoreResult,
  BackupValidationResult,
  UnavailableBackup,
} from "@platform/domain";
import {
  backupDescriptorSchema,
  backupRestoreResultSchema,
  backupValidationResultSchema,
  unavailableBackupSchema,
} from "@platform/schemas";

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function parseDescriptor(payload: unknown): BackupDescriptor {
  return Object.freeze(backupDescriptorSchema.parse(payload));
}

function parseDescriptorList(
  payloads: readonly unknown[],
): readonly BackupDescriptor[] {
  return Object.freeze(
    payloads.flatMap((payload) => {
      const parsed = backupDescriptorSchema.safeParse(payload);
      return parsed.success ? [Object.freeze(parsed.data)] : [];
    }),
  );
}

function parseUnavailableBackup(payload: unknown): UnavailableBackup {
  return Object.freeze(unavailableBackupSchema.parse(payload));
}

export class TauriBackupRepository implements BackupRepository {
  async listBackups(): Promise<readonly BackupDescriptor[]> {
    if (!isTauriRuntime()) {
      return [];
    }

    const payloads = await invoke<readonly unknown[]>("list_backups");
    return parseDescriptorList(payloads);
  }

  async listUnavailableBackups(): Promise<readonly UnavailableBackup[]> {
    if (!isTauriRuntime()) {
      return [];
    }

    const payloads = await invoke<readonly unknown[]>(
      "list_unavailable_backups",
    );
    return Object.freeze(payloads.map(parseUnavailableBackup));
  }

  async createBackup(
    reason: BackupReason,
    createdAt: string,
  ): Promise<BackupDescriptor> {
    if (!isTauriRuntime()) {
      throw new Error(
        "Backup creation is available only in the English Focus desktop app.",
      );
    }

    const payload = await invoke<unknown>("create_backup", {
      reason,
      createdAt,
    });
    return parseDescriptor(payload);
  }

  async validateBackup(fileName: string): Promise<BackupValidationResult> {
    if (!isTauriRuntime()) {
      return Object.freeze({
        valid: false,
        issues: Object.freeze(["Backup validation requires the desktop app."]),
      });
    }

    const payload = await invoke<unknown>("validate_backup", { fileName });
    return Object.freeze(backupValidationResultSchema.parse(payload));
  }

  async restoreBackup(
    fileName: string,
    restoredAt: string,
  ): Promise<BackupRestoreResult> {
    if (!isTauriRuntime()) {
      throw new Error(
        "Backup restore is available only in the English Focus desktop app.",
      );
    }

    const payload = await invoke<unknown>("restore_backup", {
      fileName,
      restoredAt,
    });
    return Object.freeze(backupRestoreResultSchema.parse(payload));
  }

  async deleteBackup(fileName: string): Promise<void> {
    if (!isTauriRuntime()) {
      throw new Error(
        "Backup deletion is available only in the English Focus desktop app.",
      );
    }

    await invoke("delete_backup", { fileName });
  }

  async deleteUnavailableBackup(fileName: string): Promise<void> {
    if (!isTauriRuntime()) {
      throw new Error(
        "Backup deletion is available only in the English Focus desktop app.",
      );
    }

    await invoke("delete_unavailable_backup", { fileName });
  }
}
