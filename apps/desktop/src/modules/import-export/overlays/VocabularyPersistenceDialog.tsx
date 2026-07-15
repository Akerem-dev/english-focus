import type { VocabularyPersistenceOutcome, VocabularyPersistencePlan } from "../application";

import { Button, Modal, StatusBadge } from "../../../components";
import { AppIcon } from "../../../design-system";

export type VocabularyPersistenceStatus = "ready" | "saving" | "success" | "error";

export interface VocabularyPersistenceDialogProps {
  readonly open: boolean;
  readonly plan: VocabularyPersistencePlan;
  readonly status: VocabularyPersistenceStatus;
  readonly outcome?: VocabularyPersistenceOutcome | undefined;
  readonly error?: string | undefined;
  readonly onBack: () => void;
  readonly onClose: () => void;
  readonly onOpenEntry: (word: string) => void;
  readonly onSave: () => void;
}

export function VocabularyPersistenceDialog({
  error,
  onBack,
  onClose,
  onOpenEntry,
  onSave,
  open,
  outcome,
  plan,
  status
}: VocabularyPersistenceDialogProps) {
  const succeeded = status === "success" && outcome !== undefined;
  const word = plan.entry.normalizedWord;
  const storageActionLabel =
    plan.kind === "keep-existing"
      ? "Keep existing entry"
      : plan.layer === "override"
        ? "Save user override"
        : "Save user entry";
  const title =
    status === "saving"
      ? "Saving vocabulary entry"
      : succeeded
        ? outcome.kind === "kept-existing"
          ? "Existing entry kept"
          : "Saved to local library"
        : "Save vocabulary entry";

  return (
    <Modal
      description={
        succeeded
          ? `The local persistence decision for “${word}” is complete.`
          : `Confirm the final local action for “${word}”. This is the first step that can write vocabulary content to SQLite.`
      }
      footer={
        succeeded ? (
          <>
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
            <Button
              leadingIcon={<AppIcon name="book-open" size={17} />}
              onClick={() => {
                onOpenEntry(word);
              }}
              variant="primary"
            >
              Open vocabulary entry
            </Button>
          </>
        ) : (
          <>
            <Button disabled={status === "saving"} onClick={onClose} variant="ghost">
              Close import
            </Button>
            <Button disabled={status === "saving"} onClick={onBack} variant="secondary">
              Back to duplicate check
            </Button>
            <Button
              isLoading={status === "saving"}
              leadingIcon={<AppIcon name="check" size={17} />}
              onClick={onSave}
              variant="primary"
            >
              {plan.kind === "keep-existing" ? "Finish without changes" : plan.actionLabel}
            </Button>
          </>
        )
      }
      onClose={onClose}
      open={open}
      size="medium"
      title={title}
    >
      <div className="persistence-dialog__metadata">
        <StatusBadge tone="accent">Word: {word}</StatusBadge>
        <StatusBadge tone={plan.kind === "save" ? "success" : "neutral"}>
          {plan.kind === "save" ? `${plan.layer} layer` : "No database write"}
        </StatusBadge>
        <StatusBadge>SQLite local storage</StatusBadge>
      </div>

      <section
        className="persistence-dialog__status"
        data-tone={status === "error" ? "error" : succeeded ? "success" : "ready"}
      >
        <span aria-hidden="true">
          <AppIcon name={status === "error" ? "warning" : "check"} size={22} />
        </span>
        <div>
          <h3>
            {status === "error"
              ? "The entry could not be saved"
              : succeeded
                ? outcome.kind === "kept-existing"
                  ? "No vocabulary content was changed"
                  : "The entry is now persistent"
                : plan.kind === "keep-existing"
                  ? "Keep the current local entry"
                  : "Ready for the first local write"}
          </h3>
          <p>{status === "error" ? error : plan.summary}</p>
        </div>
      </section>

      <dl className="persistence-dialog__summary">
        <div>
          <dt>Word:</dt>
          <dd>{plan.entry.word}</dd>
        </div>
        <div>
          <dt>Storage action:</dt>
          <dd>{storageActionLabel}</dd>
        </div>
        <div>
          <dt>Examples:</dt>
          <dd>{plan.entry.examples.length}</dd>
        </div>
        <div>
          <dt>User metadata:</dt>
          <dd>Preserved separately</dd>
        </div>
      </dl>

      {succeeded && outcome.kind === "saved" ? (
        <p className="persistence-dialog__restart-note">
          Restart proof: close English Focus, open it again, and search for “{word}”. The entry must
          still be available.
        </p>
      ) : null}
    </Modal>
  );
}
