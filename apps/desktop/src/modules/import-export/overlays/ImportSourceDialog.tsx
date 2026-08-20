import { Button, Modal } from "../../../components";
import { AppIcon } from "../../../design-system";

import "../../../styles/json-import.css";

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
      size="medium"
      title="Import vocabulary"
    >
      <div className="import-source-options">
        <button
          className="import-source-option"
          onClick={onSelectSingleEntry}
          type="button"
        >
          <span className="import-source-option__icon" aria-hidden="true">
            <AppIcon name="file" size={22} />
          </span>
          <span>
            <strong>One vocabulary entry</strong>
            <small>Import a single English Focus JSON entry.</small>
          </span>
        </button>
        <button className="import-source-option" onClick={onSelectPack} type="button">
          <span className="import-source-option__icon" aria-hidden="true">
            <AppIcon name="books" size={22} />
          </span>
          <span>
            <strong>Vocabulary pack</strong>
            <small>Import a complete English Focus vocabulary pack.</small>
          </span>
        </button>
      </div>
    </Modal>
  );
}
