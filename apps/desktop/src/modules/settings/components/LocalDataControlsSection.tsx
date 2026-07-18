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
import { Button } from "../../../components";
import { AppIcon } from "../../../design-system";
import {
  FULL_LOCAL_RESET_CATEGORIES,
  canCreateSafetyBackup,
  isFullResetConfirmation,
  selectedLocalDataCount
} from "../application";
import {
  ResetApplicationDialog,
  SelectiveDataRemovalDialog,
  type LocalDataCategoryOption
} from "./LocalDataRemovalDialogs";

const emptySnapshot: LocalDataSnapshot = Object.freeze({
  studyMetadataRecords: 0,
  userVocabularyEntries: 0,
  overrideVocabularyEntries: 0,
  settingsRecords: 0,
  activityRecords: 0,
  backupFiles: 0
});

type DialogMode = "selective" | "full-reset" | undefined;

interface LocalDataControlsSectionProps {
  readonly showHeading?: boolean;
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
  return `${total} ${total === 1 ? "item" : "items"}`;
}

export function LocalDataControlsSection({ showHeading = true }: LocalDataControlsSectionProps) {
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
  const [dialogMode, setDialogMode] = useState<DialogMode>();
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
        cause instanceof Error ? cause.message : "Your data summary could not be loaded.";
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

  const categoryOptions: readonly LocalDataCategoryOption[] = Object.freeze([
    {
      category: "study-metadata",
      title: "Favorites, tags & notes",
      description: "Your favorites, personal notes, tags, and word-view history.",
      count: snapshot.studyMetadataRecords
    },
    {
      category: "user-vocabulary",
      title: "Words I added",
      description: "Words you created or imported, including their linked personal details.",
      count: snapshot.userVocabularyEntries
    },
    {
      category: "overrides",
      title: "Built-in words I edited",
      description: "Your edits are removed and the original built-in versions return.",
      count: snapshot.overrideVocabularyEntries
    },
    {
      category: "settings",
      title: "Application preferences",
      description: "Theme, accessibility, backup, content, and explanation preferences.",
      count: snapshot.settingsRecords
    },
    {
      category: "activity",
      title: "Recent activity",
      description: "Only the activity timeline stored on this device.",
      count: snapshot.activityRecords
    },
    {
      category: "backups",
      title: "Saved backups",
      description: "Every saved backup on this device. This cannot be recovered afterward.",
      count: snapshot.backupFiles
    }
  ]);

  const selectiveSafetyAvailable = canCreateSafetyBackup(selectedCategories);
  const selectedCount = selectedLocalDataCount(snapshot, selectedCategories);
  const selectiveCanSubmit =
    selectedCategories.length > 0 &&
    reviewConfirmed &&
    status !== "resetting" &&
    lastResult === undefined;
  const fullResetCanSubmit =
    isFullResetConfirmation(confirmationText) && status !== "resetting" && lastResult === undefined;

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
    setDialogMode(undefined);
    resetDialogState();
  }, [resetDialogState, status]);

  function openDialog(mode: Exclude<DialogMode, undefined>) {
    resetDialogState();
    setDialogMode(mode);
  }

  function toggleCategory(category: LocalDataCategory, checked: boolean) {
    setSelectedCategories((current) => {
      const next = checked
        ? [...current.filter((item) => item !== category), category]
        : current.filter((item) => item !== category);
      setReviewConfirmed(false);
      setCreateSafetyBackup(canCreateSafetyBackup(next));
      return Object.freeze(next);
    });
  }

  async function performReset(categories: readonly LocalDataCategory[], fullReset: boolean) {
    setStatus("resetting");
    setError(undefined);
    setLastResult(undefined);

    try {
      const safetyAvailable = canCreateSafetyBackup(categories);
      const result = await repository.resetLocalData({
        categories,
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

      if (!categories.includes("activity")) {
        await recordActivity({
          kind: "local-data-reset",
          scope: "settings",
          label: fullReset ? "English Focus reset" : "Selected data removed"
        }).catch(() => undefined);
      }

      const nextSnapshot = await repository.getSnapshot();
      setSnapshot(nextSnapshot);
      setLastResult(result);
      setStatus("ready");
      showToast({
        title: fullReset ? "English Focus was reset" : "Selected data was removed",
        message: `${deletedSummary(result)} removed${result.safetyBackup === undefined ? "." : "; a recovery copy was created first."}`,
        tone: "success",
        dedupeKey: fullReset ? "full-local-reset-success" : "selected-local-data-reset-success"
      });
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : fullReset
            ? "English Focus could not be reset."
            : "The selected data could not be removed.";
      setError(message);
      setStatus("error");
      showToast({
        title: fullReset ? "English Focus was not reset" : "Selected data was not removed",
        message: "The operation did not complete. Review the message and try again.",
        tone: "error",
        dedupeKey: fullReset ? "full-local-reset-error" : "selected-local-data-reset-error"
      });
    }
  }

  const resultMessage =
    lastResult === undefined
      ? undefined
      : `${deletedSummary(lastResult)} removed. ${
          lastResult.safetyBackup === undefined
            ? "No recovery copy was created."
            : "A recovery copy was created first."
        }`;

  return (
    <div className="local-data-controls">
      {showHeading ? (
        <header className="local-data-controls__intro">
          <h3>My data</h3>
          <p>Review what is stored on this device. Built-in vocabulary is always kept.</p>
        </header>
      ) : null}

      {error === undefined ? null : (
        <section className="local-data-controls__error" role="alert">
          <AppIcon name="warning" size={19} />
          <div>
            <strong>Your data summary could not be loaded.</strong>
            <p>{error}</p>
          </div>
        </section>
      )}

      <section className="local-data-overview" aria-labelledby="stored-data-heading">
        <header>
          <h3 id="stored-data-heading">Stored on this device</h3>
          <p>These totals help you understand what can be managed or removed.</p>
        </header>
        <dl>
          {categoryOptions.map((option) => (
            <div key={option.category}>
              <dt>{option.title}</dt>
              <dd>{option.count}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="local-data-action-row">
        <div>
          <h3>Remove selected data</h3>
          <p>Choose individual data groups. Nothing is selected when the window opens.</p>
        </div>
        <Button
          disabled={status === "loading" || status === "resetting"}
          onClick={() => {
            openDialog("selective");
          }}
          variant="secondary"
        >
          Choose data
        </Button>
      </section>

      <section className="local-data-reset-entry">
        <div>
          <p className="route-page__eyebrow">Reset</p>
          <h3>Reset English Focus</h3>
          <p>
            Remove added words, edits, personal details, settings, and activity. Built-in words and
            saved backups stay available.
          </p>
        </div>
        <Button
          disabled={status === "loading" || status === "resetting"}
          onClick={() => {
            openDialog("full-reset");
          }}
          variant="danger"
        >
          Open reset options
        </Button>
      </section>

      <SelectiveDataRemovalDialog
        busy={status === "resetting"}
        canSubmit={selectiveCanSubmit}
        categories={categoryOptions}
        createSafetyBackup={createSafetyBackup}
        onClose={closeDialog}
        onCreateSafetyBackupChange={setCreateSafetyBackup}
        onReviewConfirmedChange={setReviewConfirmed}
        onSubmit={() => {
          void performReset(selectedCategories, false);
        }}
        onToggleCategory={toggleCategory}
        open={dialogMode === "selective"}
        resultMessage={resultMessage}
        reviewConfirmed={reviewConfirmed}
        safetyAvailable={selectiveSafetyAvailable}
        selectedCategories={selectedCategories}
        selectedCount={selectedCount}
      />

      <ResetApplicationDialog
        busy={status === "resetting"}
        canSubmit={fullResetCanSubmit}
        confirmationText={confirmationText}
        createSafetyBackup={createSafetyBackup}
        onClose={closeDialog}
        onConfirmationTextChange={setConfirmationText}
        onCreateSafetyBackupChange={setCreateSafetyBackup}
        onSubmit={() => {
          void performReset(FULL_LOCAL_RESET_CATEGORIES, true);
        }}
        open={dialogMode === "full-reset"}
        resultMessage={resultMessage}
      />
    </div>
  );
}
