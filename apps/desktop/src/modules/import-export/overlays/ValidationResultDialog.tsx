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
  readonly onRunContentChecks: () => void;
}

export function ValidationResultDialog({
  expectedWord,
  onClose,
  onEditJson,
  onOpenCorrectionInstruction,
  onRunContentChecks,
  open,
  result
}: ValidationResultDialogProps) {
  const passed = result.kind === "success";

  return (
    <Modal
      description={
        passed
          ? `“${expectedWord}” includes all required information and is ready for the next review.`
          : `Some required information in “${expectedWord}” is missing or invalid.`
      }
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
          <Button onClick={onEditJson} variant="secondary">
            Edit entry data
          </Button>
          {passed ? (
            <Button
              leadingIcon={<AppIcon name="check" size={17} />}
              onClick={onRunContentChecks}
              variant="primary"
            >
              Continue review
            </Button>
          ) : (
            <Button
              leadingIcon={<AppIcon name="copy" size={17} />}
              onClick={onOpenCorrectionInstruction}
              variant="primary"
            >
              Copy correction request
            </Button>
          )}
        </>
      }
      onClose={onClose}
      open={open}
      size="large"
      title={
        passed ? "Required information is complete" : "Some required information needs attention"
      }
    >
      <div className="validation-result-dialog__metadata" aria-label="Entry check summary">
        <StatusBadge tone="accent">Word: {expectedWord}</StatusBadge>
        <StatusBadge tone={passed ? "success" : "danger"}>
          {passed
            ? "Ready to continue"
            : `${result.issues.length} ${result.issues.length === 1 ? "item" : "items"} to fix`}
        </StatusBadge>
      </div>

      {passed ? (
        <section className="validation-result-dialog__success" aria-live="polite">
          <span aria-hidden="true">
            <AppIcon name="check" size={22} />
          </span>
          <div>
            <h3>The entry is complete</h3>
            <p>
              The word details, translations, forms, and three examples are present and readable.
            </p>
          </div>
        </section>
      ) : (
        <ValidationIssueList
          heading="Items to fix"
          issues={result.issues}
          showTechnicalDetails={false}
        />
      )}

      {passed ? null : (
        <div className="validation-result-dialog__next-stage">
          <h3>Fix these items to continue</h3>
          <p>Edit the entry data, correct the items above, and check it again.</p>
        </div>
      )}
    </Modal>
  );
}
