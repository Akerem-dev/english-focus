import type { ImportIssue } from "@platform/domain";

import { Button, Modal, StatusBadge, ValidationIssueList } from "../../../components";
import { AppIcon } from "../../../design-system";
import type { InspectVocabularyContentResult } from "../application";

export interface ContentValidationResultDialogProps {
  readonly open: boolean;
  readonly expectedWord: string;
  readonly result: InspectVocabularyContentResult;
  readonly onClose: () => void;
  readonly onEditJson: () => void;
  readonly onOpenCorrectionInstruction: () => void;
  readonly onPreview: () => void;
}

function formatReviewMessage(issue: ImportIssue): string {
  if (issue.code === "generator_warning") {
    return "This entry has not been reviewed yet. Check the definitions, examples, and word forms before saving.";
  }

  return issue.message.replace(/^Generator warning:\s*/u, "");
}

export function ContentValidationResultDialog({
  expectedWord,
  onClose,
  onEditJson,
  onOpenCorrectionInstruction,
  onPreview,
  open,
  result
}: ContentValidationResultDialogProps) {
  const hasWarnings = result.qualityWarnings.length > 0;
  const hasBlockingIssues = result.blockingIssues.length > 0;
  const title = result.semanticPassed ? "Entry is ready to review" : "Some content needs attention";

  return (
    <Modal
      description={
        result.semanticPassed
          ? `“${expectedWord}” passed the required checks. Review it before adding it to your library; nothing has been saved yet.`
          : `Some details in “${expectedWord}” do not agree with each other yet.`
      }
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
          <Button onClick={onEditJson} variant="secondary">
            Edit entry data
          </Button>
          {hasBlockingIssues ? (
            <Button
              leadingIcon={<AppIcon name="copy" size={17} />}
              onClick={onOpenCorrectionInstruction}
              variant="primary"
            >
              Copy correction request
            </Button>
          ) : null}
          {result.semanticPassed ? (
            <Button onClick={onPreview} variant="primary">
              Review entry
            </Button>
          ) : null}
        </>
      }
      onClose={onClose}
      open={open}
      size="large"
      title={title}
    >
      <div className="validation-result-dialog__metadata" aria-label="Entry review summary">
        <StatusBadge tone="accent">Word: {expectedWord}</StatusBadge>
        <StatusBadge tone={result.semanticPassed ? "success" : "danger"}>
          {result.semanticPassed
            ? "Ready to review"
            : `${result.blockingIssues.length} ${result.blockingIssues.length === 1 ? "item" : "items"} to fix`}
        </StatusBadge>
        <StatusBadge tone={hasWarnings ? "warning" : "success"}>
          {hasWarnings
            ? `${result.qualityWarnings.length} review ${result.qualityWarnings.length === 1 ? "note" : "notes"}`
            : "No review notes"}
        </StatusBadge>
      </div>

      {result.semanticPassed ? (
        <section className="validation-result-dialog__success" aria-live="polite">
          <span aria-hidden="true">
            <AppIcon name="check" size={22} />
          </span>
          <div>
            <h3>Everything looks consistent</h3>
            <p>The word, meanings, forms, translations, and examples agree with one another.</p>
          </div>
        </section>
      ) : (
        <ValidationIssueList
          heading="Items to fix"
          issues={result.blockingIssues}
          showTechnicalDetails={false}
        />
      )}

      {hasWarnings ? (
        <ValidationIssueList
          formatMessage={formatReviewMessage}
          heading={result.qualityWarnings.length === 1 ? "Review note" : "Review notes"}
          issues={result.qualityWarnings}
          showTechnicalDetails={false}
        />
      ) : null}

      {result.canContinue ? null : (
        <div className="validation-result-dialog__next-stage">
          <h3>Fix these items to continue</h3>
          <p>Edit the entry data, correct the items above, and run the check again.</p>
        </div>
      )}
    </Modal>
  );
}
