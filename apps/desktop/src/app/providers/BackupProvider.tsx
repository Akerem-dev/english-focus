import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import type {
  BackupDescriptor,
  BackupReason,
  BackupRestoreResult,
  BackupValidationResult,
  UnavailableBackup,
} from "@platform/domain";

import { TauriBackupRepository } from "../../infrastructure/persistence";
import {
  automaticBackupDelayMs,
  automaticBackupRetryDelayMs,
  findCreatedBackup,
  sortBackupsNewestFirst,
} from "../../modules/backup";
import { publishActivity } from "../../modules/history";
import {
  BackupContext,
  type BackupContextValue,
  type BackupStatus,
} from "./BackupContext";
import { useSettings } from "./useSettings";
import { useVocabularyMetadata } from "./useVocabularyMetadata";
import { useVocabularyRepository } from "./useVocabularyRepository";

interface BackupInventoryLoad {
  readonly backups: readonly BackupDescriptor[];
  readonly unavailableBackups: readonly UnavailableBackup[];
  readonly warning?: string | undefined;
}

interface CreatedBackupOutcome {
  readonly backup: BackupDescriptor;
  readonly warning?: string | undefined;
}

function isDesktopRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function isBackupOperationBusy(status: BackupStatus): boolean {
  return (
    status === "loading" ||
    status === "creating" ||
    status === "validating" ||
    status === "restoring" ||
    status === "deleting"
  );
}

function unavailableBackupWarning(count: number): string | undefined {
  if (count === 0) {
    return undefined;
  }

  return `${count} backup ${count === 1 ? "file needs" : "files need"} attention. You can review and remove ${
    count === 1 ? "it" : "them"
  } from View backups.`;
}

function combineWarnings(
  ...warnings: readonly (string | undefined)[]
): string | undefined {
  const unique = [
    ...new Set(
      warnings.filter((warning): warning is string => warning !== undefined),
    ),
  ];
  return unique.length === 0 ? undefined : unique.join(" ");
}

export function BackupProvider({ children }: PropsWithChildren) {
  const repository = useMemo(() => new TauriBackupRepository(), []);
  const { settings, status: settingsStatus, refreshSettings } = useSettings();
  const { refresh: refreshVocabulary } = useVocabularyRepository();
  const { refresh: refreshMetadata } = useVocabularyMetadata();
  const [backups, setBackups] = useState<readonly BackupDescriptor[]>([]);
  const [unavailableBackups, setUnavailableBackups] = useState<
    readonly UnavailableBackup[]
  >([]);
  const [status, setStatus] = useState<BackupStatus>("loading");
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [warning, setWarning] = useState<string | undefined>();
  const [lastRestore, setLastRestore] = useState<
    BackupRestoreResult | undefined
  >();
  const [automaticRetryAt, setAutomaticRetryAt] = useState<
    number | undefined
  >();
  const automaticFailureCount = useRef(0);
  const automaticRunInFlight = useRef(false);

  const loadInventory = useCallback(async (): Promise<BackupInventoryLoad> => {
    const [availableResult, unavailableResult] = await Promise.allSettled([
      repository.listBackups(),
      repository.listUnavailableBackups(),
    ]);

    if (availableResult.status === "rejected") {
      throw availableResult.reason;
    }

    const listed = sortBackupsNewestFirst(availableResult.value);
    if (unavailableResult.status === "rejected") {
      return Object.freeze({
        backups: listed,
        unavailableBackups: Object.freeze([]),
        warning:
          "Saved backups are available, but some backup files could not be reviewed.",
      });
    }

    const unavailable = Object.freeze(
      [...unavailableResult.value].sort((left, right) =>
        left.fileName.localeCompare(right.fileName),
      ),
    );
    return Object.freeze({
      backups: listed,
      unavailableBackups: unavailable,
      warning: unavailableBackupWarning(unavailable.length),
    });
  }, [repository]);

  const applyInventory = useCallback((inventory: BackupInventoryLoad) => {
    setBackups(inventory.backups);
    setUnavailableBackups(inventory.unavailableBackups);
    setInventoryLoaded(true);
  }, []);

  const refreshBackups = useCallback(async () => {
    setStatus("loading");
    setError(undefined);

    try {
      const inventory = await loadInventory();
      applyInventory(inventory);
      setWarning(inventory.warning);
      setStatus("ready");
      return inventory.backups;
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Backups could not be loaded.";
      setError(message);
      setStatus("error");
      throw cause;
    }
  }, [applyInventory, loadInventory]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshBackups().catch(() => undefined);
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [refreshBackups]);

  const createBackupWithRecovery = useCallback(
    async (
      reason: BackupReason,
      createdAt: string,
    ): Promise<CreatedBackupOutcome> => {
      try {
        return Object.freeze({
          backup: await repository.createBackup(reason, createdAt),
        });
      } catch (cause) {
        try {
          const listed = sortBackupsNewestFirst(await repository.listBackups());
          const recovered = findCreatedBackup(listed, reason, createdAt);
          if (recovered !== undefined) {
            setBackups(listed);
            return Object.freeze({
              backup: recovered,
              warning:
                "The backup was created, but older backup files could not be cleaned up.",
            });
          }
        } catch {
          // Keep the original creation failure when the recovery check is unavailable.
        }

        throw cause;
      }
    },
    [repository],
  );

  const refreshAfterCreation = useCallback(
    async (created: BackupDescriptor): Promise<string | undefined> => {
      setBackups((current) =>
        sortBackupsNewestFirst([
          created,
          ...current.filter((backup) => backup.fileName !== created.fileName),
        ]),
      );

      try {
        const inventory = await loadInventory();
        applyInventory(inventory);
        return inventory.warning;
      } catch {
        return "The backup was created, but the backup list could not be refreshed.";
      }
    },
    [applyInventory, loadInventory],
  );

  const runAutomaticBackup = useCallback(async () => {
    if (automaticRunInFlight.current || !isDesktopRuntime()) {
      return;
    }

    automaticRunInFlight.current = true;
    setStatus("creating");
    setError(undefined);

    const createdAt = new Date().toISOString();
    try {
      const created = await createBackupWithRecovery("automatic", createdAt);
      const refreshWarning = await refreshAfterCreation(created.backup);
      automaticFailureCount.current = 0;
      setAutomaticRetryAt(undefined);
      setWarning(combineWarnings(created.warning, refreshWarning));
      setStatus("ready");
      publishActivity({
        kind: "backup-created",
        scope: "backup",
        label: "Automatic backup created",
      });
    } catch {
      automaticFailureCount.current += 1;
      const retryDelay = automaticBackupRetryDelayMs(
        automaticFailureCount.current,
      );
      setAutomaticRetryAt(Date.now() + retryDelay);
      setError(
        "Automatic backup could not be created. English Focus will try again automatically.",
      );
      setStatus("error");
    } finally {
      automaticRunInFlight.current = false;
    }
  }, [createBackupWithRecovery, refreshAfterCreation]);

  useEffect(() => {
    automaticFailureCount.current = 0;
    setAutomaticRetryAt(undefined);
  }, [settings.data.automaticBackups, settings.data.backupFrequency]);

  useEffect(() => {
    const automaticEnabled =
      isDesktopRuntime() &&
      (settingsStatus === "ready" || settingsStatus === "saved") &&
      settings.data.automaticBackups &&
      settings.data.backupFrequency !== "manual";

    if (
      !automaticEnabled ||
      !inventoryLoaded ||
      isBackupOperationBusy(status)
    ) {
      return;
    }

    const now = Date.now();
    const delay =
      automaticRetryAt === undefined
        ? automaticBackupDelayMs(
            backups,
            settings.data.backupFrequency,
            new Date(now),
          )
        : Math.max(0, automaticRetryAt - now);

    if (delay === undefined) {
      return;
    }

    const timer = window.setTimeout(() => {
      void runAutomaticBackup();
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    automaticRetryAt,
    backups,
    inventoryLoaded,
    runAutomaticBackup,
    settings.data.automaticBackups,
    settings.data.backupFrequency,
    settingsStatus,
    status,
  ]);

  const createManualBackup = useCallback(async () => {
    setStatus("creating");
    setError(undefined);
    setWarning(undefined);

    const createdAt = new Date().toISOString();
    try {
      const created = await createBackupWithRecovery("manual", createdAt);
      const refreshWarning = await refreshAfterCreation(created.backup);
      setWarning(combineWarnings(created.warning, refreshWarning));
      setStatus("ready");
      publishActivity({
        kind: "backup-created",
        scope: "backup",
        label: "Manual backup created",
      });
      return created.backup;
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Backup could not be created.";
      setError(message);
      setStatus("error");
      throw cause;
    }
  }, [createBackupWithRecovery, refreshAfterCreation]);

  const validateBackup = useCallback(
    async (fileName: string): Promise<BackupValidationResult> => {
      setStatus("validating");
      setError(undefined);

      try {
        const result = await repository.validateBackup(fileName);
        setStatus("ready");
        return result;
      } catch (cause) {
        const message =
          cause instanceof Error
            ? cause.message
            : "Backup could not be validated.";
        setError(message);
        setStatus("error");
        throw cause;
      }
    },
    [repository],
  );

  const restoreBackup = useCallback(
    async (fileName: string) => {
      setStatus("restoring");
      setError(undefined);
      setWarning(undefined);
      setLastRestore(undefined);

      try {
        const restored = await repository.restoreBackup(
          fileName,
          new Date().toISOString(),
        );
        publishActivity({
          kind: "backup-restored",
          scope: "backup",
          label: "Local backup restored",
        });
        await Promise.all([
          refreshVocabulary(),
          refreshMetadata(),
          refreshSettings(),
        ]);
        const inventory = await loadInventory();
        applyInventory(inventory);
        setWarning(inventory.warning);
        setLastRestore(restored);
        setStatus("ready");
        return restored;
      } catch (cause) {
        const message =
          cause instanceof Error
            ? cause.message
            : "Backup could not be restored.";
        setError(message);
        setStatus("error");
        throw cause;
      }
    },
    [
      applyInventory,
      loadInventory,
      refreshMetadata,
      refreshSettings,
      refreshVocabulary,
      repository,
    ],
  );

  const deleteBackup = useCallback(
    async (fileName: string) => {
      setStatus("deleting");
      setError(undefined);

      try {
        await repository.deleteBackup(fileName);
        publishActivity({
          kind: "backup-deleted",
          scope: "backup",
          label: "Retained backup deleted",
        });
        const inventory = await loadInventory();
        applyInventory(inventory);
        setWarning(inventory.warning);
        setStatus("ready");
      } catch (cause) {
        const message =
          cause instanceof Error
            ? cause.message
            : "Backup could not be deleted.";
        setError(message);
        setStatus("error");
        throw cause;
      }
    },
    [applyInventory, loadInventory, repository],
  );

  const deleteUnavailableBackup = useCallback(
    async (fileName: string) => {
      setStatus("deleting");
      setError(undefined);

      try {
        await repository.deleteUnavailableBackup(fileName);
        const inventory = await loadInventory();
        applyInventory(inventory);
        setWarning(inventory.warning);
        setStatus("ready");
      } catch (cause) {
        const message =
          cause instanceof Error
            ? cause.message
            : "The unavailable backup file could not be removed.";
        setError(message);
        setStatus("error");
        throw cause;
      }
    },
    [applyInventory, loadInventory, repository],
  );

  const clearLastRestore = useCallback(() => {
    setLastRestore(undefined);
  }, []);

  const value = useMemo<BackupContextValue>(
    () => ({
      backups,
      unavailableBackups,
      status,
      error,
      warning,
      lastRestore,
      refreshBackups,
      createManualBackup,
      validateBackup,
      restoreBackup,
      deleteBackup,
      deleteUnavailableBackup,
      clearLastRestore,
    }),
    [
      backups,
      clearLastRestore,
      createManualBackup,
      deleteBackup,
      deleteUnavailableBackup,
      error,
      lastRestore,
      refreshBackups,
      restoreBackup,
      status,
      unavailableBackups,
      validateBackup,
      warning,
    ],
  );

  return (
    <BackupContext.Provider value={value}>{children}</BackupContext.Provider>
  );
}
