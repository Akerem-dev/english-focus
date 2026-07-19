import { useState } from "react";

import { useBackup } from "../../../app/providers";
import { Button } from "../../../components";
import { AppIcon } from "../../../design-system";
import { BackupProgressDialog, BackupRestoreDialog } from "../../backup";
import { UnavailableBackupFiles } from "./UnavailableBackupFiles";

function formatDate(value: string | undefined): string {
  if (value === undefined) {
    return "No backup yet";
  }

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

export function BackupSettingsSection() {
  const {
    backups,
    clearLastRestore,
    createManualBackup,
    deleteBackup,
    deleteUnavailableBackup,
    error,
    lastRestore,
    restoreBackup,
    status,
    unavailableBackups,
    validateBackup,
    warning
  } = useBackup();
  const [managerOpen, setManagerOpen] = useState(false);
  const busy =
    status === "loading" ||
    status === "creating" ||
    status === "validating" ||
    status === "restoring" ||
    status === "deleting";
  const latest = backups[0];
  const savedFileCount = backups.length + unavailableBackups.length;

  return (
    <section aria-label="Backup status and actions" className="backup-settings-inline">
      <div className="backup-settings-inline__facts">
        <div className="backup-settings-inline__fact">
          <span>Saved backups</span>
          <strong>{savedFileCount}</strong>
        </div>
        <div className="backup-settings-inline__fact">
          <span>Most recent backup</span>
          <strong>{formatDate(latest?.createdAt)}</strong>
        </div>
      </div>

      <div className="backup-settings-actions">
        <Button
          disabled={busy}
          isLoading={status === "creating"}
          leadingIcon={<AppIcon name="download" size={17} />}
          onClick={() => {
            void createManualBackup().catch(() => undefined);
          }}
          variant="primary"
        >
          Back up now
        </Button>
        <Button
          disabled={status === "loading"}
          leadingIcon={<AppIcon name="settings" size={17} />}
          onClick={() => {
            setManagerOpen(true);
          }}
          variant="secondary"
        >
          View backups
        </Button>
      </div>

      {status === "error" ? (
        <p className="backup-settings-status" role="alert">
          A backup action could not be completed. Open your backups for details.
        </p>
      ) : null}

      {warning === undefined ? null : (
        <p className="backup-settings-status backup-settings-status--warning" role="status">
          {warning}
        </p>
      )}

      <p className="backup-settings-note">
        Backups stay on this device. English Focus keeps recent automatic backups and recovery
        copies so older files do not pile up.
      </p>

      <UnavailableBackupFiles
        busy={busy}
        files={unavailableBackups}
        onRemove={deleteUnavailableBackup}
      />

      <BackupRestoreDialog
        backups={backups}
        busy={busy}
        error={error}
        lastRestore={lastRestore}
        onClearRestoreResult={clearLastRestore}
        onClose={() => {
          setManagerOpen(false);
        }}
        onDelete={deleteBackup}
        onRestore={restoreBackup}
        onValidate={validateBackup}
        open={managerOpen}
      />

      <BackupProgressDialog
        mode={status === "restoring" ? "restoring" : "creating"}
        onClose={() => undefined}
        open={status === "creating" || status === "restoring"}
      />
    </section>
  );
}
