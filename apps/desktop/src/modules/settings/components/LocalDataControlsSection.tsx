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
    title: "Study details",
    description:
      "Favorites, tags, personal notes, learning status, review status, and view history.",
    count: (snapshot) => snapshot.studyMetadataRecords
  },
  {
    category: "user-vocabulary",
    title: "User vocabulary",
    description:
      "Vocabulary entries created or imported by you. Their linked study details are removed too.",
    count: (snapshot) => snapshot.userVocabularyEntries
  },
  {
    category: "overrides",
    title: "Core vocabulary overrides",
    description:
      "Your replacement versions are removed; bundled core entries become visible again.",
    count: (snapshot) => snapshot.overrideVocabularyEntries
  },
  {
    category: "settings",
    title: "Application settings",
    description:
      "Theme, content display, accessibility, backup, and AI instruction preferences return to defaults.",
    count: (snapshot) => snapshot.settingsRecords
  },
  {
    category: "activity",
    title: "Recent activity",
    description: "Only the privacy-safe local activity timeline is cleared.",
    count: (snapshot) => snapshot.activityRecords
  },
  {
    category: "backups",
    title: "Retained backups",
    description:
      "Every retained backup file is permanently deleted. This cannot create a safety backup.",
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
          <h3>Local data controls</h3>
          <p>
            Review exact record counts, remove only selected categories, or return the application
            to a clean local state without touching bundled core vocabulary.
          </p>
        </div>
        <StatusBadge tone={error === undefined ? "success" : "danger"}>
          {status === "loading"
            ? "Loading counts"
            : status === "resetting"
              ? "Removing locally"
              : "Protected actions"}
        </StatusBadge>
      </div>

      {error === undefined ? null : (
        <section className="local-data-controls__error" role="alert">
          <AppIcon name="warning" size={19} />
          <div>
            <strong>Local data controls need attention.</strong>
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
          <dt>Core overrides</dt>
          <dd>{snapshot.overrideVocabularyEntries}</dd>
        </div>
        <div>
          <dt>Study details</dt>
          <dd>{snapshot.studyMetadataRecords}</dd>
        </div>
        <div>
          <dt>Activity records</dt>
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
          Choose data to remove
        </Button>
        <Button
          disabled={status === "loading" || status === "resetting"}
          onClick={() => {
            openWithSelection(FULL_LOCAL_RESET_CATEGORIES);
          }}
          variant="danger"
        >
          Review full local reset
        </Button>
      </div>

      <p className="local-data-controls__boundary">
        Full local reset removes user vocabulary, overrides, study details, settings, and activity.
        Retained backups stay available unless you explicitly select backup deletion.
      </p>

      <Modal
        description="Select only the local data categories you intend to remove. No operation begins until every confirmation step is complete."
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
        title="Review local data removal"
      >
        <div className="local-data-dialog">
          <section className="local-data-dialog__selection">
            <header>
              <p className="route-page__eyebrow">Step 1</p>
              <h3>Choose categories</h3>
              <p>Bundled core vocabulary is never deleted by these controls.</p>
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
                        <StatusBadge>{formatCount(count, "record")}</StatusBadge>
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
            <h3>Recovery boundary</h3>
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
                <strong>Create a safety backup before removal</strong>
                <small>
                  {safetyAvailable
                    ? "Recommended. Vocabulary, study details, and settings can be restored later."
                    : selectedCategories.includes("backups")
                      ? "Unavailable because retained backups are included in this deletion."
                      : "Not needed for the currently selected category."}
                </small>
              </span>
            </label>
          </section>

          <section className="local-data-dialog__confirmation">
            <p className="route-page__eyebrow">Step 3</p>
            <h3>Explicit confirmation</h3>
            <div className="local-data-impact-summary">
              <span>Selected categories</span>
              <strong>{selectedCategories.length}</strong>
              <span>Current matching records</span>
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
              <span>
                I reviewed the selected categories and understand the removal is permanent.
              </span>
            </label>
            <TextField
              autoComplete="off"
              data-autofocus="true"
              disabled={selectedCategories.length === 0 || status === "resetting"}
              helperText={`Type ${expectedPhrase} exactly to enable the final action.`}
              label="Confirmation phrase"
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
                <strong>Removal completed</strong>
                <p>
                  {deletedSummary(lastResult)} removed.{" "}
                  {lastResult.safetyBackup === undefined
                    ? "No safety backup was created."
                    : "A retained safety backup was created before the transaction."}
                </p>
              </div>
            </section>
          )}
        </div>
      </Modal>
    </div>
  );
}
