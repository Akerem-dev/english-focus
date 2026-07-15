import { Button, Modal, StatusBadge, ValidationIssueList } from "../../../components";
import { AppIcon } from "../../../design-system";
import type { ValidateVocabularySchemaResult } from "../application";

export interface ValidationResultDialogProps {
  readonly open: boolean;
  readonly expectedWord: string;
  readonly result: ValidateVocabularySchemaResult;
  readonly onClose: () => void;
  readonly onEditJson: () => void;
  readonly onOpenCorrectionInstruction: () => void;
}

export function ValidationResultDialog({
  expectedWord,
  onClose,
  onEditJson,
  onOpenCorrectionInstruction,
  open,
  result
}: ValidationResultDialogProps) {
  const passed = result.kind === "success";

  return (
    <Modal
      description={
        passed
          ? `The JSON for “${expectedWord}” matches the versioned vocabulary structure.`
          : `The JSON for “${expectedWord}” does not match the versioned vocabulary structure yet.`
      }
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Close import
          </Button>
          <Button onClick={onEditJson} variant="secondary">
            Edit JSON
          </Button>
          {passed ? (
            <Button
              disabled
              title="Preview arrives in the next import checkpoint"
              variant="primary"
            >
              Preview next
            </Button>
          ) : (
            <Button
              leadingIcon={<AppIcon name="copy" size={17} />}
              onClick={onOpenCorrectionInstruction}
              variant="primary"
            >
              Copy correction instruction
            </Button>
          )}
        </>
      }
      onClose={onClose}
      open={open}
      size="large"
      title={passed ? "Schema validation passed" : "Schema validation found issues"}
    >
      <div className="validation-result-dialog__metadata" aria-label="Validation metadata">
        <StatusBadge tone="accent">Expected word: {expectedWord}</StatusBadge>
        <StatusBadge>Schema 1.0.0</StatusBadge>
        <StatusBadge tone={passed ? "success" : "danger"}>
          {passed ? "Structurally valid" : `${result.issues.length} issues`}
        </StatusBadge>
      </div>

      {passed ? (
        <section className="validation-result-dialog__success" aria-live="polite">
          <span aria-hidden="true">
            <AppIcon name="check" size={22} />
          </span>
          <div>
            <h3>Vocabulary structure is valid</h3>
            <p>
              Required fields, value types, strict object boundaries, and exactly ten primary
              examples passed the local Zod contract.
            </p>
          </div>
        </section>
      ) : (
        <ValidationIssueList issues={result.issues} />
      )}

      <div className="validation-result-dialog__next-stage">
        <h3>Not checked in this checkpoint</h3>
        <p>
          Target-word consistency, semantic correctness, content quality, duplicate handling, and
          saving remain separate gates. Passing this dialog does not add anything to Library.
        </p>
      </div>
    </Modal>
  );
}
