import { Modal } from "../../../components";
import { AppIcon } from "../../../design-system";

interface BackupProgressDialogProps {
  readonly open: boolean;
  readonly mode: "creating" | "restoring";
  readonly onClose: () => void;
}

export function BackupProgressDialog({ mode, onClose, open }: BackupProgressDialogProps) {
  const isRestore = mode === "restoring";

  return (
    <Modal
      description={
        isRestore
          ? "English Focus is validating the selected backup, creating a safety copy, and replacing local data in one transaction."
          : "English Focus is collecting vocabulary, study metadata, and application settings into a retained local backup."
      }
      onClose={onClose}
      open={open}
      title={isRestore ? "Restoring local backup" : "Creating local backup"}
    >
      <div className="backup-progress" role="status">
        <span aria-hidden="true" className="backup-progress__icon">
          <AppIcon name={isRestore ? "upload" : "download"} size={24} />
        </span>
        <div>
          <strong>{isRestore ? "Restore in progress" : "Backup in progress"}</strong>
          <p>
            {isRestore
              ? "Do not close the application until the restore transaction finishes."
              : "Everything stays on this device. No network request is made."}
          </p>
        </div>
      </div>
    </Modal>
  );
}
