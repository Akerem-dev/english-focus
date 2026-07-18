import { useMemo, useState } from "react";
import type {
  BackupDescriptor,
  BackupRestoreResult,
  BackupValidationResult
} from "@platform/domain";

import { Button, Modal } from "../../../components";
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

  return reason === "automatic" ? "Automatic backup" : "Manual backup";
}

function backupContentsSummary(backup: BackupDescriptor): string {
  const personalItems = backup.counts.vocabularyMetadata;
  const words = backup.counts.vocabularyEntries;

  if (words === 0 && personalItems === 0) {
    return "App settings only";
  }

  return `${words} saved ${words === 1 ? "word" : "words"} · ${personalItems} personal ${
    personalItems === 1 ? "item" : "items"
  }`;
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
  const [deleteReviewOpen, setDeleteReviewOpen] = useState(false);

  const selected = useMemo(
    () => backups.find((backup) => backup.fileName === selectedFileName),
    [backups, selectedFileName]
  );

  function resetSelectionState() {
    setValidation(undefined);
    setConfirmed(false);
    setDeleteReviewOpen(false);
  }

  function closeDialog() {
    setSelectedFileName(undefined);
    resetSelectionState();
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
    if (selected === undefined || !deleteReviewOpen) {
      return;
    }

    await onDelete(selected.fileName);
    setSelectedFileName(undefined);
    resetSelectionState();
  }

  return (
    <Modal
      description="Choose a backup to review or restore."
      footer={
        <>
          <Button disabled={busy} onClick={closeDialog} variant="ghost">
            Close
          </Button>

          {validation?.valid === true ? (
            <>
              <Button
                disabled={selected === undefined || busy}
                onClick={() => {
                  void validateSelected();
                }}
                variant="secondary"
              >
                Check again
              </Button>
              <Button
                disabled={selected === undefined || !confirmed || busy}
                onClick={() => {
                  void restoreSelected();
                }}
                variant="primary"
              >
                Restore backup
              </Button>
            </>
          ) : (
            <Button
              disabled={selected === undefined || busy}
              onClick={() => {
                void validateSelected();
              }}
              variant="primary"
            >
              {validation === undefined ? "Check backup" : "Check again"}
            </Button>
          )}
        </>
      }
      onClose={closeDialog}
      open={open}
      size="large"
      title="Backups"
    >
      {error === undefined ? null : (
        <section className="backup-alert backup-alert--error" role="alert">
          <div>
            <strong>The backup action did not finish.</strong>
            <p>Your existing data is unchanged. Close this window and try again.</p>
            <details className="backup-technical-details">
              <summary>Technical details</summary>
              <p>{error}</p>
            </details>
          </div>
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
        <div className="backup-manager-layout backup-manager-layout--task-focused">
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
                      resetSelectionState();
                    }}
                    type="radio"
                  />
                  <span className="backup-list-item__content">
                    <span className="backup-list-item__header">
                      <strong>{formatDate(backup.createdAt)}</strong>
                      <span className="backup-list-item__size">{formatSize(backup.sizeBytes)}</span>
                    </span>
                    <span className="backup-list-item__kind">{reasonLabel(backup.reason)}</span>
                    <small>{backupContentsSummary(backup)}</small>
                  </span>
                </label>
              );
            })}
          </section>

          <aside className="backup-inspector">
            {selected === undefined ? (
              <div className="backup-inspector__placeholder">
                <AppIcon name="search" size={28} />
                <h3>Select a backup</h3>
                <p>Choose one from the list to see what it contains.</p>
              </div>
            ) : (
              <>
                <header className="backup-inspector__header">
                  <p className="route-page__eyebrow">Selected backup</p>
                  <h3>{formatDate(selected.createdAt)}</h3>
                  <p>
                    {reasonLabel(selected.reason)} · {formatSize(selected.sizeBytes)}
                  </p>
                </header>

                <dl className="backup-inspector__summary">
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
                    <dd>{selected.counts.settingsRecords > 0 ? "Included" : "Not included"}</dd>
                  </div>
                </dl>

                {validation === undefined ? (
                  <p className="backup-inspector__note">
                    Check this backup before restoring it. The check stays on this device.
                  </p>
                ) : validation.valid ? (
                  <section className="backup-validation backup-validation--valid">
                    <AppIcon name="check" size={19} />
                    <div>
                      <strong>Ready to restore</strong>
                      <p>Review the confirmation below, then restore when you are ready.</p>
                    </div>
                  </section>
                ) : (
                  <section className="backup-validation backup-validation--invalid" role="alert">
                    <AppIcon name="warning" size={19} />
                    <div>
                      <strong>This backup cannot be restored</strong>
                      <p>It did not pass the local safety check.</p>
                      <details className="backup-technical-details">
                        <summary>Why it failed</summary>
                        <ul>
                          {validation.issues.map((issue) => (
                            <li key={issue}>{issue}</li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  </section>
                )}

                {validation?.valid === true ? (
                  <label className="backup-confirmation">
                    <input
                      checked={confirmed}
                      disabled={busy}
                      onChange={(event) => {
                        setConfirmed(event.currentTarget.checked);
                      }}
                      type="checkbox"
                    />
                    <span>
                      <strong>Replace my current saved data with this backup.</strong>
                      <small>A recovery copy of the current data will be created first.</small>
                    </span>
                  </label>
                ) : null}

                <details className="backup-secondary-options">
                  <summary>More options</summary>

                  <div className="backup-secondary-options__content">
                    <details className="backup-technical-details">
                      <summary>Technical details</summary>
                      <dl>
                        <div>
                          <dt>File</dt>
                          <dd>{selected.fileName}</dd>
                        </div>
                        <div>
                          <dt>Backup version</dt>
                          <dd>{selected.backupVersion}</dd>
                        </div>
                        <div>
                          <dt>Storage format</dt>
                          <dd>{selected.databaseSchemaVersion}</dd>
                        </div>
                      </dl>
                    </details>

                    <div className="backup-delete-disclosure">
                      {deleteReviewOpen ? (
                        <div
                          className="backup-delete-review"
                          role="group"
                          aria-label="Delete backup"
                        >
                          <div>
                            <strong>Delete this backup?</strong>
                            <p>This removes only this saved backup file.</p>
                          </div>
                          <div className="backup-delete-review__actions">
                            <Button
                              disabled={busy}
                              onClick={() => {
                                setDeleteReviewOpen(false);
                              }}
                              size="small"
                              variant="ghost"
                            >
                              Cancel
                            </Button>
                            <Button
                              disabled={busy}
                              onClick={() => {
                                void deleteSelected();
                              }}
                              size="small"
                              variant="danger"
                            >
                              Delete backup
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          disabled={busy}
                          onClick={() => {
                            setDeleteReviewOpen(true);
                          }}
                          size="small"
                          variant="ghost"
                        >
                          Delete this backup
                        </Button>
                      )}
                    </div>
                  </div>
                </details>
              </>
            )}
          </aside>
        </div>
      )}
    </Modal>
  );
}
