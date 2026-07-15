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
      description="Choose whether this local JSON file contains one vocabulary entry or a complete English Focus vocabulary pack."
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
        <button className="import-source-card" onClick={onSelectSingleEntry} type="button">
          <span aria-hidden="true">
            <AppIcon name="book-open" size={26} />
          </span>
          <strong>One vocabulary entry</strong>
          <small>
            Import one versioned vocabulary object through the full validation workflow.
          </small>
        </button>
        <button className="import-source-card" onClick={onSelectPack} type="button">
          <span aria-hidden="true">
            <AppIcon name="books" size={26} />
          </span>
          <strong>Vocabulary pack</strong>
          <small>
            Analyze, review, and import multiple saved entries with explicit error and duplicate
            rules.
          </small>
        </button>
      </div>
    </Modal>
  );
}
