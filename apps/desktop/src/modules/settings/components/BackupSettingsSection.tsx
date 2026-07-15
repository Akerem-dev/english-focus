import { useState } from "react";

import { useBackup } from "../../../app/providers";
import { Button, StatusBadge } from "../../../components";
import { AppIcon } from "../../../design-system";
import { BackupProgressDialog, BackupRestoreDialog } from "../../backup";

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
    error,
    lastRestore,
    restoreBackup,
    status,
    validateBackup
  } = useBackup();
  const [managerOpen, setManagerOpen] = useState(false);
  const busy =
    status === "creating" ||
    status === "validating" ||
    status === "restoring" ||
    status === "deleting";
  const latest = backups[0];

  return (
    <>
      <div className="backup-settings-summary">
        <div>
          <span>Retained backups</span>
          <strong>{backups.length}</strong>
        </div>
        <div>
          <span>Latest backup</span>
          <strong>{formatDate(latest?.createdAt)}</strong>
        </div>
      </div>

      <div className="backup-settings-actions">
        <Button
          disabled={busy}
          isLoading={status === "creating"}
          leadingIcon={<AppIcon name="download" size={17} />}
          onClick={() => {
            void createManualBackup();
          }}
          variant="primary"
        >
          Create backup now
        </Button>
        <Button
          disabled={status === "loading"}
          leadingIcon={<AppIcon name="settings" size={17} />}
          onClick={() => {
            setManagerOpen(true);
          }}
          variant="secondary"
        >
          Manage backups
        </Button>
        {status === "error" ? (
          <StatusBadge tone="danger">Backup needs attention</StatusBadge>
        ) : (
          <StatusBadge tone="success">Local retention ready</StatusBadge>
        )}
      </div>

      <p className="backup-settings-note">
        Manual backups are retained until you delete them. Automatic backups keep the newest seven;
        restore safety backups keep the newest five.
      </p>

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
    </>
  );
}
