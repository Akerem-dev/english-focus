import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import type {
  BackupDescriptor,
  BackupRestoreResult,
  BackupValidationResult
} from "@platform/domain";

import { TauriBackupRepository } from "../../infrastructure/persistence";
import { publishActivity } from "../../modules/history";
import { isAutomaticBackupDue, sortBackupsNewestFirst } from "../../modules/backup";
import { BackupContext, type BackupContextValue, type BackupStatus } from "./BackupContext";
import { useSettings } from "./useSettings";
import { useVocabularyMetadata } from "./useVocabularyMetadata";
import { useVocabularyRepository } from "./useVocabularyRepository";

export function BackupProvider({ children }: PropsWithChildren) {
  const repository = useMemo(() => new TauriBackupRepository(), []);
  const { settings, status: settingsStatus, refreshSettings } = useSettings();
  const { refresh: refreshVocabulary } = useVocabularyRepository();
  const { refresh: refreshMetadata } = useVocabularyMetadata();
  const [backups, setBackups] = useState<readonly BackupDescriptor[]>([]);
  const [status, setStatus] = useState<BackupStatus>("loading");
  const [error, setError] = useState<string | undefined>();
  const [lastRestore, setLastRestore] = useState<BackupRestoreResult | undefined>();
  const automaticCheckCompleted = useRef(false);

  const refreshBackups = useCallback(async () => {
    setStatus("loading");
    setError(undefined);

    try {
      const listed = sortBackupsNewestFirst(await repository.listBackups());
      setBackups(listed);
      setStatus("ready");
      return listed;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Backups could not be loaded.";
      setError(message);
      setStatus("error");
      throw cause;
    }
  }, [repository]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshBackups().catch(() => undefined);
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [refreshBackups]);

  useEffect(() => {
    if (
      automaticCheckCompleted.current ||
      settingsStatus !== "ready" ||
      !settings.data.automaticBackups ||
      settings.data.backupFrequency === "manual" ||
      status === "loading"
    ) {
      return;
    }

    automaticCheckCompleted.current = true;

    if (!isAutomaticBackupDue(backups, settings.data.backupFrequency, new Date())) {
      return;
    }

    const timer = window.setTimeout(() => {
      setStatus("creating");
      void repository
        .createBackup("automatic", new Date().toISOString())
        .then(async () => {
          const listed = sortBackupsNewestFirst(await repository.listBackups());
          setBackups(listed);
          setStatus("ready");
        })
        .catch((cause) => {
          setError(
            cause instanceof Error ? cause.message : "Automatic backup could not be created."
          );
          setStatus("error");
        });
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [backups, repository, settings.data, settingsStatus, status]);

  const createManualBackup = useCallback(async () => {
    setStatus("creating");
    setError(undefined);

    try {
      const created = await repository.createBackup("manual", new Date().toISOString());
      publishActivity({
        kind: "backup-created",
        scope: "backup",
        label: "Manual backup created"
      });
      const listed = sortBackupsNewestFirst(await repository.listBackups());
      setBackups(listed);
      setStatus("ready");
      return created;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Backup could not be created.";
      setError(message);
      setStatus("error");
      throw cause;
    }
  }, [repository]);

  const validateBackup = useCallback(
    async (fileName: string): Promise<BackupValidationResult> => {
      setStatus("validating");
      setError(undefined);

      try {
        const result = await repository.validateBackup(fileName);
        setStatus("ready");
        return result;
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Backup could not be validated.";
        setError(message);
        setStatus("error");
        throw cause;
      }
    },
    [repository]
  );

  const restoreBackup = useCallback(
    async (fileName: string) => {
      setStatus("restoring");
      setError(undefined);
      setLastRestore(undefined);

      try {
        const restored = await repository.restoreBackup(fileName, new Date().toISOString());
        publishActivity({
          kind: "backup-restored",
          scope: "backup",
          label: "Local backup restored"
        });
        await Promise.all([refreshVocabulary(), refreshMetadata(), refreshSettings()]);
        const listed = sortBackupsNewestFirst(await repository.listBackups());
        setBackups(listed);
        setLastRestore(restored);
        setStatus("ready");
        return restored;
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Backup could not be restored.";
        setError(message);
        setStatus("error");
        throw cause;
      }
    },
    [refreshMetadata, refreshSettings, refreshVocabulary, repository]
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
          label: "Retained backup deleted"
        });
        const listed = sortBackupsNewestFirst(await repository.listBackups());
        setBackups(listed);
        setStatus("ready");
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Backup could not be deleted.";
        setError(message);
        setStatus("error");
        throw cause;
      }
    },
    [repository]
  );

  const clearLastRestore = useCallback(() => {
    setLastRestore(undefined);
  }, []);

  const value = useMemo<BackupContextValue>(
    () => ({
      backups,
      status,
      error,
      lastRestore,
      refreshBackups,
      createManualBackup,
      validateBackup,
      restoreBackup,
      deleteBackup,
      clearLastRestore
    }),
    [
      backups,
      clearLastRestore,
      createManualBackup,
      deleteBackup,
      error,
      lastRestore,
      refreshBackups,
      restoreBackup,
      status,
      validateBackup
    ]
  );

  return <BackupContext.Provider value={value}>{children}</BackupContext.Provider>;
}
