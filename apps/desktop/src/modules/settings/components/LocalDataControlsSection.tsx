import { useCallback, useEffect, useState } from "react";
import type { LocalDataCategory, LocalDataSnapshot, ResetLocalDataResult } from "@platform/domain";

import {
  useActivity,
  useBackup,
  useMaintenance,
  useSettings,
  useToast,
  useVocabularyMetadata,
  useVocabularyRepository
} from "../../../app/providers";
import { Button, Modal, StatusBadge, TextField } from "../../../components";
import { AppIcon } from "../../../design-system";
import {
  FULL_LOCAL_RESET_CATEGORIES,
  canCreateSafetyBackup,
  requiredLocalDataConfirmation,
  selectedLocalDataCount
} from "../application";

const emptySnapshot: LocalDataSnapshot = Object.freeze({
  studyMetadataRecords: 0,
  userVocabularyEntries: 0,
  overrideVocabularyEntries: 0,
  settingsRecords: 0,
  activityRecords: 0,
  backupFiles: 0
});

interface CategoryDefinition {
  readonly category: LocalDataCategory;
  readonly title: string;
  readonly description: string;
  readonly count: (snapshot: LocalDataSnapshot) => number;
}

const categoryDefinitions: readonly CategoryDefinition[] = Object.freeze([
  {
    category: "study-metadata",
    title: "Favorites, tags & notes",
    description: "Your favorites, tags, personal notes, and word-view history.",
    count: (snapshot) => snapshot.studyMetadataRecords
  },
  {
    category: "user-vocabulary",
    title: "Words I added",
    description:
      "Words you created or imported. Their linked favorites, tags, and notes are removed too.",
    count: (snapshot) => snapshot.userVocabularyEntries
  },
  {
    category: "overrides",
    title: "Built-in words I edited",
    description: "Your edits are removed and the original built-in versions are shown again.",
    count: (snapshot) => snapshot.overrideVocabularyEntries
  },
  {
    category: "settings",
    title: "Application settings",
    description:
      "Theme, content, accessibility, backup, and explanation preferences return to their defaults.",
    count: (snapshot) => snapshot.settingsRecords
  },
  {
    category: "activity",
    title: "Recent activity",
    description: "Only the activity list saved on this device is cleared.",
    count: (snapshot) => snapshot.activityRecords
  },
  {
    category: "backups",
    title: "Saved backups",
    description:
      "Every saved backup is permanently deleted. A recovery copy cannot be created for this choice.",
    count: (snapshot) => snapshot.backupFiles
  }
]);

function formatCount(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function deletedSummary(result: ResetLocalDataResult): string {
  const deleted = result.deleted;
  const total =
    deleted.studyMetadataRecords +
    deleted.userVocabularyEntries +
    deleted.overrideVocabularyEntries +
    deleted.settingsRecords +
    deleted.activityRecords +
    deleted.backupFiles;
  return formatCount(total, "local record");
}

export function LocalDataControlsSection() {
  const { localDataRepository: repository } = useMaintenance();
  const { refreshActivity, recordActivity } = useActivity();
  const { refreshBackups } = useBackup();
  const { refreshSettings } = useSettings();
  const { showToast } = useToast();
  const { refresh: refreshMetadata } = useVocabularyMetadata();
  const { refresh: refreshVocabulary } = useVocabularyRepository();
  const [snapshot, setSnapshot] = useState<LocalDataSnapshot>(emptySnapshot);
  const [status, setStatus] = useState<"loading" | "ready" | "resetting" | "error">("loading");
  const [error, setError] = useState<string | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<readonly LocalDataCategory[]>([]);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [createSafetyBackup, setCreateSafetyBackup] = useState(true);
  const [lastResult, setLastResult] = useState<ResetLocalDataResult | undefined>();

  const refreshSnapshot = useCallback(async () => {
    setStatus("loading");
    setError(undefined);

    try {
      const next = await repository.getSnapshot();
      setSnapshot(next);
      setStatus("ready");
      return next;
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Local data counts could not be loaded.";
      setError(message);
      setStatus("error");
      throw cause;
    }
  }, [repository]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshSnapshot().catch(() => undefined);
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [refreshSnapshot]);

  const expectedPhrase = requiredLocalDataConfirmation(selectedCategories);
  const safetyAvailable = canCreateSafetyBackup(selectedCategories);
  const selectedCount = selectedLocalDataCount(snapshot, selectedCategories);
  const canSubmit =
    selectedCategories.length > 0 &&
    reviewConfirmed &&
    confirmationText.trim() === expectedPhrase &&
    status !== "resetting" &&
    lastResult === undefined;

  const resetDialogState = useCallback(() => {
    setSelectedCategories([]);
    setReviewConfirmed(false);
    setConfirmationText("");
    setCreateSafetyBackup(true);
    setLastResult(undefined);
  }, []);

  const closeDialog = useCallback(() => {
    if (status === "resetting") {
      return;
    }
    setDialogOpen(false);
    resetDialogState();
  }, [resetDialogState, status]);

  function openWithSelection(categories: readonly LocalDataCategory[]) {
    setSelectedCategories(Object.freeze([...categories]));
    setReviewConfirmed(false);
    setConfirmationText("");
    setCreateSafetyBackup(canCreateSafetyBackup(categories));
    setLastResult(undefined);
    setDialogOpen(true);
  }

  function toggleCategory(category: LocalDataCategory, checked: boolean) {
    setSelectedCategories((current) => {
      const next = checked
        ? [...current.filter((item) => item !== category), category]
        : current.filter((item) => item !== category);
      setReviewConfirmed(false);
      setConfirmationText("");
      setCreateSafetyBackup(canCreateSafetyBackup(next));
      return Object.freeze(next);
    });
  }

  async function performReset() {
    if (!canSubmit) {
      return;
    }

    setStatus("resetting");
    setError(undefined);
    setLastResult(undefined);

    try {
      const result = await repository.resetLocalData({
        categories: selectedCategories,
        createSafetyBackup: safetyAvailable && createSafetyBackup,
        requestedAt: new Date().toISOString()
      });

      await Promise.all([
        refreshVocabulary(),
        refreshMetadata(),
        refreshSettings(),
        refreshActivity(),
        refreshBackups()
      ]);

      if (!selectedCategories.includes("activity")) {
        await recordActivity({
          kind: "local-data-reset",
          scope: "settings",
          label: "Selected local data removed"
        }).catch(() => undefined);
      }

      const nextSnapshot = await repository.getSnapshot();
      setSnapshot(nextSnapshot);
      setLastResult(result);
      setStatus("ready");
      showToast({
        title: "Local data removal completed",
        message: `${deletedSummary(result)} removed${result.safetyBackup === undefined ? "." : "; a safety backup was created first."}`,
        tone: "success",
        dedupeKey: "local-data-reset-success"
      });
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Selected local data could not be removed.";
      setError(message);
      setStatus("error");
      showToast({
        title: "Local data was not removed",
        message: "The operation did not complete. Review the message and try again.",
        tone: "error",
        dedupeKey: "local-data-reset-error"
      });
    }
  }

  return (
    <div className="local-data-controls">
      <div className="local-data-controls__intro">
        <div>
          <h3>My data</h3>
          <p>
            Review what English Focus stores on this device and remove only what you choose.
            Built-in vocabulary is always kept.
          </p>
        </div>
        <StatusBadge tone={error === undefined ? "success" : "danger"}>
          {status === "loading"
            ? "Loading"
            : status === "resetting"
              ? "Removing"
              : "Your data stays protected"}
        </StatusBadge>
      </div>

      {error === undefined ? null : (
        <section className="local-data-controls__error" role="alert">
          <AppIcon name="warning" size={19} />
          <div>
            <strong>Your data could not be loaded.</strong>
            <p>{error}</p>
          </div>
        </section>
      )}

      <dl className="local-data-summary">
        <div>
          <dt>User vocabulary</dt>
          <dd>{snapshot.userVocabularyEntries}</dd>
        </div>
        <div>
          <dt>Edited built-in words</dt>
          <dd>{snapshot.overrideVocabularyEntries}</dd>
        </div>
        <div>
          <dt>Study details</dt>
          <dd>{snapshot.studyMetadataRecords}</dd>
        </div>
        <div>
          <dt>Activity items</dt>
          <dd>{snapshot.activityRecords}</dd>
        </div>
        <div>
          <dt>Retained backups</dt>
          <dd>{snapshot.backupFiles}</dd>
        </div>
      </dl>

      <div className="local-data-presets">
        <Button
          disabled={status === "loading" || status === "resetting"}
          onClick={() => {
            openWithSelection([]);
          }}
          variant="secondary"
        >
          Choose what to remove
        </Button>
        <Button
          disabled={status === "loading" || status === "resetting"}
          onClick={() => {
            openWithSelection(FULL_LOCAL_RESET_CATEGORIES);
          }}
          variant="danger"
        >
          Reset the app
        </Button>
      </div>

      <p className="local-data-controls__boundary">
        Resetting removes your added words, edits, notes, settings, and activity. Saved backups stay
        available unless you choose to remove them too.
      </p>

      <Modal
        description="Choose what you want to remove from this device. Nothing is deleted until you confirm."
        footer={
          <>
            <Button disabled={status === "resetting"} onClick={closeDialog} variant="ghost">
              {lastResult === undefined ? "Cancel" : "Close"}
            </Button>
            <Button
              disabled={!canSubmit}
              isLoading={status === "resetting"}
              onClick={() => {
                void performReset();
              }}
              variant="danger"
            >
              Remove selected local data
            </Button>
          </>
        }
        onClose={closeDialog}
        open={dialogOpen}
        size="large"
        title="Remove data from this device"
      >
        <div className="local-data-dialog">
          <section className="local-data-dialog__selection">
            <header>
              <p className="route-page__eyebrow">Step 1</p>
              <h3>Choose what to remove</h3>
              <p>Built-in vocabulary is always kept.</p>
            </header>
            <div className="local-data-category-list">
              {categoryDefinitions.map((definition) => {
                const selected = selectedCategories.includes(definition.category);
                const count = definition.count(snapshot);
                return (
                  <label
                    className="local-data-category"
                    data-selected={selected || undefined}
                    key={definition.category}
                  >
                    <input
                      checked={selected}
                      disabled={status === "resetting"}
                      onChange={(event) => {
                        toggleCategory(definition.category, event.currentTarget.checked);
                      }}
                      type="checkbox"
                    />
                    <span>
                      <span className="local-data-category__heading">
                        <strong>{definition.title}</strong>
                        <StatusBadge>{formatCount(count, "item")}</StatusBadge>
                      </span>
                      <small>{definition.description}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="local-data-dialog__safety">
            <p className="route-page__eyebrow">Step 2</p>
            <h3>Keep a recovery copy</h3>
            <label className="local-data-safety-option">
              <input
                checked={safetyAvailable && createSafetyBackup}
                disabled={!safetyAvailable || status === "resetting"}
                onChange={(event) => {
                  setCreateSafetyBackup(event.currentTarget.checked);
                }}
                type="checkbox"
              />
              <span>
                <strong>Back up before removing anything</strong>
                <small>
                  {safetyAvailable
                    ? "Recommended. Your words, notes, and settings can be restored later."
                    : selectedCategories.includes("backups")
                      ? "Unavailable because saved backups are included in this removal."
                      : "Not needed for what you selected."}
                </small>
              </span>
            </label>
          </section>

          <section className="local-data-dialog__confirmation">
            <p className="route-page__eyebrow">Step 3</p>
            <h3>Confirm removal</h3>
            <div className="local-data-impact-summary">
              <span>Selected items</span>
              <strong>{selectedCategories.length}</strong>
              <span>Items found</span>
              <strong>{selectedCount}</strong>
            </div>
            <label className="local-data-review-check">
              <input
                checked={reviewConfirmed}
                disabled={selectedCategories.length === 0 || status === "resetting"}
                onChange={(event) => {
                  setReviewConfirmed(event.currentTarget.checked);
                }}
                type="checkbox"
              />
              <span>I reviewed my choices and understand that this cannot be undone.</span>
            </label>
            <TextField
              autoComplete="off"
              data-autofocus="true"
              disabled={selectedCategories.length === 0 || status === "resetting"}
              helperText={`For extra safety, type ${expectedPhrase} exactly.`}
              label="Type to confirm"
              onChange={(event) => {
                setConfirmationText(event.currentTarget.value);
              }}
              placeholder={expectedPhrase}
              spellCheck={false}
              value={confirmationText}
            />
          </section>

          {lastResult === undefined ? null : (
            <section className="local-data-dialog__result" role="status">
              <AppIcon name="check" size={20} />
              <div>
                <strong>Your selected data was removed</strong>
                <p>
                  {deletedSummary(lastResult)} removed.{" "}
                  {lastResult.safetyBackup === undefined
                    ? "No recovery copy was created."
                    : "A recovery copy was created first."}
                </p>
              </div>
            </section>
          )}
        </div>
      </Modal>
    </div>
  );
}
