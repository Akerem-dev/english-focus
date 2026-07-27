import { Button, Modal } from "../../../components";
import { AppIcon } from "../../../design-system";

export interface ImportSourceDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSelectPack: () => void;
  readonly onSelectSingleEntry: () => void;
}

export function ImportSourceDialog({
  onClose,
  onSelectPack,
  onSelectSingleEntry,
  open
}: ImportSourceDialogProps) {
  return (
    <Modal
      description="Import a complete English Focus pack, or use the advanced JSON fallback for one externally prepared entry."
      footer={
        <Button onClick={onClose} variant="ghost">
          Cancel
        </Button>
      }
      onClose={onClose}
      open={open}
      title="Import vocabulary"
    >
      <div className="import-source-grid">
        <button className="import-source-card" onClick={onSelectPack} type="button">
          <span aria-hidden="true">
            <AppIcon name="books" size={26} />
          </span>
          <strong>Vocabulary pack</strong>
          <small>
            Recommended for complete English Focus packs. Review multiple entries, errors, and
            duplicates before saving.
          </small>
        </button>
        <button
          className="import-source-card import-source-card--advanced"
          onClick={onSelectSingleEntry}
          type="button"
        >
          <span aria-hidden="true">
            <AppIcon name="book-open" size={26} />
          </span>
          <strong>Advanced JSON entry</strong>
          <small>
            Fallback for one entry prepared outside the app. The file still passes the full local
            validation workflow.
          </small>
        </button>
      </div>
    </Modal>
  );
}
