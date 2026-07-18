import { useMemo, useState } from "react";
import type {
  BackupDescriptor,
  BackupRestoreResult,
  BackupValidationResult
} from "@platform/domain";

import { Button, Modal, StatusBadge } from "../../../components";
import { AppIcon } from "../../../design-system";

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

function describeBackup(backup: BackupDescriptor): string {
  const reason = backup.reason === "pre-restore" ? "Recovery copy" : `${backup.reason} backup`;
  return `${reason} · ${backup.counts.vocabularyEntries} saved words · ${backup.counts.vocabularyMetadata} personal details`;
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
    return "Recovery copy";
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
      description="Review backups saved on this device and restore one when you need it."
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
            Check backup
          </Button>
          <Button
            disabled={selected === undefined || validation?.valid !== true || !confirmed || busy}
            onClick={() => {
              void restoreSelected();
            }}
            variant="primary"
          >
            Restore backup
          </Button>
        </>
      }
      onClose={closeDialog}
      open={open}
      size="large"
      title="Your backups"
    >
      {error === undefined ? null : (
        <section className="backup-alert backup-alert--error" role="alert">
          <strong>This backup action could not be completed.</strong>
          <p>{error}</p>
        </section>
      )}

      {lastRestore === undefined ? null : (
        <section className="backup-alert backup-alert--success" role="status">
          <span aria-hidden="true">
            <AppIcon name="check" size={20} />
          </span>
          <div>
            <strong>Backup restored</strong>
            <p>
              {lastRestore.restored.vocabularyEntries} saved words and{" "}
              {lastRestore.restored.vocabularyMetadata} personal details were restored. A recovery
              copy was created first.
            </p>
          </div>
        </section>
      )}

      {backups.length === 0 ? (
        <section className="backup-empty-state">
          <AppIcon name="download" size={34} />
          <h3>No backups yet</h3>
          <p>Create one from Data & backups whenever you want.</p>
        </section>
      ) : (
        <div className="backup-manager-layout">
          <section className="backup-list" aria-label="Saved backups">
            {backups.map((backup) => {
              const selectedState = backup.fileName === selectedFileName;

              return (
                <label
                  className="backup-list-item"
                  data-selected={selectedState || undefined}
                  key={backup.fileName}
                >
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
                <p>Choose a backup to see what it contains and check that it can be restored.</p>
              </div>
            ) : (
              <>
                <header>
                  <p className="route-page__eyebrow">Selected backup</p>
                  <h3>{reasonLabel(selected.reason)}</h3>
                  <p>
                    {formatDate(selected.createdAt)} · {formatSize(selected.sizeBytes)}
                  </p>
                </header>

                <dl className="backup-inspector__facts">
                  <div>
                    <dt>Saved words</dt>
                    <dd>{selected.counts.vocabularyEntries}</dd>
                  </div>
                  <div>
                    <dt>Favorites, notes & progress</dt>
                    <dd>{selected.counts.vocabularyMetadata}</dd>
                  </div>
                  <div>
                    <dt>App settings</dt>
                    <dd>{selected.counts.settingsRecords}</dd>
                  </div>
                  <div>
                    <dt>Backup format</dt>
                    <dd>{selected.databaseSchemaVersion}</dd>
                  </div>
                </dl>

                {validation === undefined ? (
                  <p className="backup-inspector__note">
                    Check this backup before restoring it. The check happens only on this device.
                  </p>
                ) : validation.valid ? (
                  <section className="backup-validation backup-validation--valid">
                    <AppIcon name="check" size={20} />
                    <div>
                      <strong>Backup is ready</strong>
                      <p>You can restore it after confirming below.</p>
                    </div>
                  </section>
                ) : (
                  <section className="backup-validation backup-validation--invalid" role="alert">
                    <AppIcon name="warning" size={20} />
                    <div>
                      <strong>This backup cannot be restored</strong>
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
                    <strong>
                      I understand this will replace my saved words, personal learning details, and
                      app settings.
                    </strong>
                    <small>English Focus will create a recovery copy first.</small>
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
                    I want to delete this backup
                  </label>
                  <Button
                    disabled={!deleteConfirmed || busy}
                    onClick={() => {
                      void deleteSelected();
                    }}
                    size="small"
                    variant="danger"
                  >
                    Delete backup
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
