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
}

export function ContentValidationResultDialog({
  expectedWord,
  onClose,
  onEditJson,
  onOpenCorrectionInstruction,
  open,
  result
}: ContentValidationResultDialogProps) {
  const hasWarnings = result.qualityWarnings.length > 0;
  const hasIssues = result.allIssues.length > 0;
  const title = result.semanticPassed
    ? hasWarnings
      ? "Content checks passed with warnings"
      : "Content checks passed"
    : "Content validation found issues";

  return (
    <Modal
      description={
        result.semanticPassed
          ? `The JSON for “${expectedWord}” is internally consistent with the requested word.`
          : `The JSON for “${expectedWord}” contains blocking target or cross-field inconsistencies.`
      }
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Close import
          </Button>
          <Button onClick={onEditJson} variant="secondary">
            Edit JSON
          </Button>
          {hasIssues ? (
            <Button
              leadingIcon={<AppIcon name="copy" size={17} />}
              onClick={onOpenCorrectionInstruction}
              variant={result.semanticPassed ? "secondary" : "primary"}
            >
              {result.semanticPassed
                ? "Copy improvement instruction"
                : "Copy correction instruction"}
            </Button>
          ) : null}
          {result.semanticPassed ? (
            <Button disabled title="Preview arrives in CP12" variant="primary">
              Preview next
            </Button>
          ) : null}
        </>
      }
      onClose={onClose}
      open={open}
      size="large"
      title={title}
    >
      <div className="validation-result-dialog__metadata" aria-label="Content validation metadata">
        <StatusBadge tone="accent">Expected word: {expectedWord}</StatusBadge>
        <StatusBadge tone={result.semanticPassed ? "success" : "danger"}>
          {result.semanticPassed
            ? "Semantic checks passed"
            : `${result.blockingIssues.length} blocking issues`}
        </StatusBadge>
        <StatusBadge tone={hasWarnings ? "warning" : "success"}>
          {hasWarnings
            ? `${result.qualityWarnings.length} quality warnings`
            : "Quality review clean"}
        </StatusBadge>
      </div>

      {result.semanticPassed ? (
        <section className="validation-result-dialog__success" aria-live="polite">
          <span aria-hidden="true">
            <AppIcon name="check" size={22} />
          </span>
          <div>
            <h3>Target and content relationships are consistent</h3>
            <p>
              Word identity, morphology, bilingual field pairs, examples, metadata provenance, and
              timestamps passed local semantic checks.
            </p>
          </div>
        </section>
      ) : (
        <ValidationIssueList heading="Blocking semantic issues" issues={result.blockingIssues} />
      )}

      {hasWarnings ? (
        <ValidationIssueList
          heading="Non-blocking quality warnings"
          issues={result.qualityWarnings}
        />
      ) : null}

      <div className="validation-result-dialog__next-stage">
        <h3>{result.canContinue ? "Ready for preview" : "Correction required"}</h3>
        <p>
          {result.canContinue
            ? "Quality warnings are advisory and do not block the next gate. Preview, duplicate handling, and saving arrive in later checkpoints."
            : "Blocking semantic issues must be corrected and revalidated before preview or saving can begin."}
        </p>
      </div>
    </Modal>
  );
}
