import type { LocalDataCategory } from "@platform/domain";

import { Button, Modal, TextField } from "../../../components";
import { AppIcon } from "../../../design-system";
import { RESET_APPLICATION_CONFIRMATION } from "../application";

export interface LocalDataCategoryOption {
  readonly category: LocalDataCategory;
  readonly count: number;
  readonly description: string;
  readonly title: string;
}

interface SelectiveDataRemovalDialogProps {
  readonly busy: boolean;
  readonly canSubmit: boolean;
  readonly categories: readonly LocalDataCategoryOption[];
  readonly createSafetyBackup: boolean;
  readonly open: boolean;
  readonly resultMessage?: string | undefined;
  readonly reviewConfirmed: boolean;
  readonly safetyAvailable: boolean;
  readonly selectedCategories: readonly LocalDataCategory[];
  readonly selectedCount: number;
  readonly onClose: () => void;
  readonly onCreateSafetyBackupChange: (checked: boolean) => void;
  readonly onReviewConfirmedChange: (checked: boolean) => void;
  readonly onSubmit: () => void;
  readonly onToggleCategory: (category: LocalDataCategory, checked: boolean) => void;
}

interface ResetApplicationDialogProps {
  readonly busy: boolean;
  readonly canSubmit: boolean;
  readonly confirmationText: string;
  readonly createSafetyBackup: boolean;
  readonly open: boolean;
  readonly resultMessage?: string | undefined;
  readonly onClose: () => void;
  readonly onConfirmationTextChange: (value: string) => void;
  readonly onCreateSafetyBackupChange: (checked: boolean) => void;
  readonly onSubmit: () => void;
}

function RemovalResult({ message }: { readonly message: string }) {
  return (
    <section className="local-data-dialog__result" role="status">
      <AppIcon name="check" size={20} />
      <div>
        <strong>Finished</strong>
        <p>{message}</p>
      </div>
    </section>
  );
}

export function SelectiveDataRemovalDialog({
  busy,
  canSubmit,
  categories,
  createSafetyBackup,
  open,
  resultMessage,
  reviewConfirmed,
  safetyAvailable,
  selectedCategories,
  selectedCount,
  onClose,
  onCreateSafetyBackupChange,
  onReviewConfirmedChange,
  onSubmit,
  onToggleCategory
}: SelectiveDataRemovalDialogProps) {
  const hasSelection = selectedCategories.length > 0;
  const removesBackups = selectedCategories.includes("backups");

  return (
    <Modal
      description="Choose only the information you want to remove. Nothing is selected in advance."
      footer={
        <>
          <Button disabled={busy} onClick={onClose} variant="ghost">
            {resultMessage === undefined ? "Cancel" : "Close"}
          </Button>
          <Button disabled={!canSubmit} isLoading={busy} onClick={onSubmit} variant="danger">
            Remove selected data
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="large"
      title="Remove selected data"
    >
      <div className="local-data-dialog">
        {resultMessage === undefined ? (
          <>
            <section className="local-data-dialog__selection">
              <header>
                <h3>Choose data</h3>
                <p>Built-in vocabulary is always kept.</p>
              </header>
              <div className="local-data-category-list">
                {categories.map((option) => {
                  const selected = selectedCategories.includes(option.category);
                  return (
                    <label
                      className="local-data-category"
                      data-selected={selected || undefined}
                      key={option.category}
                    >
                      <input
                        checked={selected}
                        disabled={busy}
                        onChange={(event) => {
                          onToggleCategory(option.category, event.currentTarget.checked);
                        }}
                        type="checkbox"
                      />
                      <span>
                        <span className="local-data-category__heading">
                          <strong>{option.title}</strong>
                          <small>{option.count}</small>
                        </span>
                        <small>{option.description}</small>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            {hasSelection ? (
              <section className="local-data-dialog__review">
                <div className="local-data-impact-summary">
                  <span>Selected groups</span>
                  <strong>{selectedCategories.length}</strong>
                  <span>Items found</span>
                  <strong>{selectedCount}</strong>
                </div>

                {safetyAvailable ? (
                  <label className="local-data-safety-option">
                    <input
                      checked={createSafetyBackup}
                      disabled={busy}
                      onChange={(event) => {
                        onCreateSafetyBackupChange(event.currentTarget.checked);
                      }}
                      type="checkbox"
                    />
                    <span>
                      <strong>Create a recovery copy first</strong>
                      <small>Recommended. You can restore supported data later.</small>
                    </span>
                  </label>
                ) : removesBackups ? (
                  <p className="local-data-dialog__warning">
                    Saved backups cannot be used for recovery after they are removed.
                  </p>
                ) : null}

                <label className="local-data-review-check">
                  <input
                    checked={reviewConfirmed}
                    disabled={busy}
                    onChange={(event) => {
                      onReviewConfirmedChange(event.currentTarget.checked);
                    }}
                    type="checkbox"
                  />
                  <span>I understand that the selected data will be removed from this device.</span>
                </label>
              </section>
            ) : (
              <p className="local-data-dialog__empty">
                Select at least one data group to continue.
              </p>
            )}
          </>
        ) : (
          <RemovalResult message={resultMessage} />
        )}
      </div>
    </Modal>
  );
}

export function ResetApplicationDialog({
  busy,
  canSubmit,
  confirmationText,
  createSafetyBackup,
  open,
  resultMessage,
  onClose,
  onConfirmationTextChange,
  onCreateSafetyBackupChange,
  onSubmit
}: ResetApplicationDialogProps) {
  return (
    <Modal
      description="Return English Focus to its original local state. Built-in vocabulary and saved backups stay available."
      footer={
        <>
          <Button disabled={busy} onClick={onClose} variant="ghost">
            {resultMessage === undefined ? "Cancel" : "Close"}
          </Button>
          <Button disabled={!canSubmit} isLoading={busy} onClick={onSubmit} variant="danger">
            Reset English Focus
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="medium"
      title="Reset English Focus"
    >
      <div className="local-data-dialog local-data-dialog--reset">
        {resultMessage === undefined ? (
          <>
            <section className="local-data-reset-summary">
              <h3>What will be reset</h3>
              <ul>
                <li>Words you added and edits to built-in words</li>
                <li>Favorites, tags, notes, and viewing history</li>
                <li>Application preferences and recent activity</li>
              </ul>
              <p>Saved backups are not removed by this reset.</p>
            </section>

            <label className="local-data-safety-option">
              <input
                checked={createSafetyBackup}
                disabled={busy}
                onChange={(event) => {
                  onCreateSafetyBackupChange(event.currentTarget.checked);
                }}
                type="checkbox"
              />
              <span>
                <strong>Create a recovery copy before resetting</strong>
                <small>Recommended. This gives you a way back if you change your mind.</small>
              </span>
            </label>

            <TextField
              autoComplete="off"
              data-autofocus="true"
              disabled={busy}
              helperText={`Type ${RESET_APPLICATION_CONFIRMATION} exactly to continue.`}
              label="Confirm full reset"
              onChange={(event) => {
                onConfirmationTextChange(event.currentTarget.value);
              }}
              placeholder={RESET_APPLICATION_CONFIRMATION}
              spellCheck={false}
              value={confirmationText}
            />
          </>
        ) : (
          <RemovalResult message={resultMessage} />
        )}
      </div>
    </Modal>
  );
}
