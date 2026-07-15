import { useMemo, useState } from "react";
import type {
  BackupDescriptor,
  BackupRestoreResult,
  BackupValidationResult
} from "@platform/domain";

import { Button, Modal, StatusBadge } from "../../../components";
import { AppIcon } from "../../../design-system";
import { describeBackup } from "../services";

interface BackupRestoreDialogProps {
  readonly backups: readonly BackupDescriptor[];
  readonly error?: string | undefined;
  readonly lastRestore?: BackupRestoreResult | undefined;
  readonly open: boolean;
  readonly busy: boolean;
  readonly onClose: () => void;
  readonly onDelete: (fileName: string) => Promise<void>;
  readonly onRestore: (fileName: string) => Promise<BackupRestoreResult>;
  readonly onValidate: (fileName: string) => Promise<BackupValidationResult>;
  readonly onClearRestoreResult: () => void;
}

function formatDate(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function reasonLabel(reason: BackupDescriptor["reason"]): string {
  if (reason === "pre-restore") {
    return "Safety backup";
  }

  return reason === "automatic" ? "Automatic" : "Manual";
}

export function BackupRestoreDialog({
  backups,
  busy,
  error,
  lastRestore,
  onClearRestoreResult,
  onClose,
  onDelete,
  onRestore,
  onValidate,
  open
}: BackupRestoreDialogProps) {
  const [selectedFileName, setSelectedFileName] = useState<string | undefined>();
  const [validation, setValidation] = useState<BackupValidationResult | undefined>();
  const [confirmed, setConfirmed] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const selected = useMemo(
    () => backups.find((backup) => backup.fileName === selectedFileName),
    [backups, selectedFileName]
  );

  function closeDialog() {
    setSelectedFileName(undefined);
    setValidation(undefined);
    setConfirmed(false);
    setDeleteConfirmed(false);
    onClearRestoreResult();
    onClose();
  }

  async function validateSelected() {
    if (selected === undefined) {
      return;
    }

    const result = await onValidate(selected.fileName);
    setValidation(result);
    setConfirmed(false);
  }

  async function restoreSelected() {
    if (selected === undefined || validation?.valid !== true || !confirmed) {
      return;
    }

    await onRestore(selected.fileName);
  }

  async function deleteSelected() {
    if (selected === undefined || !deleteConfirmed) {
      return;
    }

    await onDelete(selected.fileName);
    setSelectedFileName(undefined);
    setValidation(undefined);
    setDeleteConfirmed(false);
  }

  return (
    <Modal
      description="Review retained local backups, validate integrity, and restore only after an explicit confirmation."
      footer={
        <>
          <Button disabled={busy} onClick={closeDialog} variant="ghost">
            Close
          </Button>
          <Button
            disabled={selected === undefined || busy}
            onClick={() => {
              void validateSelected();
            }}
            variant="secondary"
          >
            Validate selected
          </Button>
          <Button
            disabled={selected === undefined || validation?.valid !== true || !confirmed || busy}
            onClick={() => {
              void restoreSelected();
            }}
            variant="primary"
          >
            Restore selected backup
          </Button>
        </>
      }
      onClose={closeDialog}
      open={open}
      size="large"
      title="Backup management"
    >
      {error === undefined ? null : (
        <section className="backup-alert backup-alert--error" role="alert">
          <strong>Backup operation needs attention.</strong>
          <p>{error}</p>
        </section>
      )}

      {lastRestore === undefined ? null : (
        <section className="backup-alert backup-alert--success" role="status">
          <span aria-hidden="true">
            <AppIcon name="check" size={20} />
          </span>
          <div>
            <strong>Backup restored successfully</strong>
            <p>
              {lastRestore.restored.vocabularyEntries} vocabulary entries and {" "}
              {lastRestore.restored.vocabularyMetadata} metadata records were restored. A safety
              backup was created first.
            </p>
          </div>
        </section>
      )}

      {backups.length === 0 ? (
        <section className="backup-empty-state">
          <AppIcon name="download" size={34} />
          <h3>No retained backups yet</h3>
          <p>Create a manual backup from the Data settings panel.</p>
        </section>
      ) : (
        <div className="backup-manager-layout">
          <section className="backup-list" aria-label="Retained backups">
            {backups.map((backup) => {
              const selectedState = backup.fileName === selectedFileName;

              return (
                <label className="backup-list-item" data-selected={selectedState || undefined} key={backup.fileName}>
                  <input
                    checked={selectedState}
                    disabled={busy}
                    name="backup-selection"
                    onChange={() => {
                      setSelectedFileName(backup.fileName);
                      setValidation(undefined);
                      setConfirmed(false);
                      setDeleteConfirmed(false);
                    }}
                    type="radio"
                  />
                  <span className="backup-list-item__content">
                    <span className="backup-list-item__header">
                      <strong>{reasonLabel(backup.reason)}</strong>
                      <StatusBadge tone={backup.reason === "manual" ? "accent" : "success"}>
                        {formatSize(backup.sizeBytes)}
                      </StatusBadge>
                    </span>
                    <span>{formatDate(backup.createdAt)}</span>
                    <small>{describeBackup(backup)}</small>
                  </span>
                </label>
              );
            })}
          </section>

          <aside className="backup-inspector">
            {selected === undefined ? (
              <div className="backup-inspector__placeholder">
                <AppIcon name="search" size={30} />
                <h3>Select a backup</h3>
                <p>Choose one retained backup to inspect its counts and validate its checksum.</p>
              </div>
            ) : (
              <>
                <header>
                  <p className="route-page__eyebrow">Selected backup</p>
                  <h3>{reasonLabel(selected.reason)}</h3>
                  <p>{selected.fileName}</p>
                </header>

                <dl className="backup-inspector__facts">
                  <div>
                    <dt>Vocabulary entries</dt>
                    <dd>{selected.counts.vocabularyEntries}</dd>
                  </div>
                  <div>
                    <dt>Study metadata</dt>
                    <dd>{selected.counts.vocabularyMetadata}</dd>
                  </div>
                  <div>
                    <dt>Settings records</dt>
                    <dd>{selected.counts.settingsRecords}</dd>
                  </div>
                  <div>
                    <dt>Database schema</dt>
                    <dd>{selected.databaseSchemaVersion}</dd>
                  </div>
                </dl>

                {validation === undefined ? (
                  <p className="backup-inspector__note">
                    Validate the selected file before restore. English Focus checks the backup type,
                    version, item counts, and checksum locally.
                  </p>
                ) : validation.valid ? (
                  <section className="backup-validation backup-validation--valid">
                    <AppIcon name="check" size={20} />
                    <div>
                      <strong>Integrity checks passed</strong>
                      <p>The backup is ready for an explicit restore confirmation.</p>
                    </div>
                  </section>
                ) : (
                  <section className="backup-validation backup-validation--invalid" role="alert">
                    <AppIcon name="warning" size={20} />
                    <div>
                      <strong>Backup is not safe to restore</strong>
                      <ul>
                        {validation.issues.map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}

                <label className="backup-confirmation">
                  <input
                    checked={confirmed}
                    disabled={validation?.valid !== true || busy}
                    onChange={(event) => {
                      setConfirmed(event.currentTarget.checked);
                    }}
                    type="checkbox"
                  />
                  <span>
                    <strong>I understand this replaces local vocabulary, study metadata, and settings.</strong>
                    <small>A pre-restore safety backup will be created automatically.</small>
                  </span>
                </label>

                <div className="backup-delete-zone">
                  <label>
                    <input
                      checked={deleteConfirmed}
                      disabled={busy}
                      onChange={(event) => {
                        setDeleteConfirmed(event.currentTarget.checked);
                      }}
                      type="checkbox"
                    />
                    Allow deletion of this retained backup
                  </label>
                  <Button
                    disabled={!deleteConfirmed || busy}
                    onClick={() => {
                      void deleteSelected();
                    }}
                    size="small"
                    variant="danger"
                  >
                    Delete selected backup
                  </Button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </Modal>
  );
}
