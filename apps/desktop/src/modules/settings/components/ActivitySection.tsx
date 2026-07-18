import { useMemo, useState } from "react";
import type { ActivityFilter } from "@platform/domain";

import { useActivity, useToast } from "../../../app/providers";
import { Button, SelectField } from "../../../components";
import { AppIcon } from "../../../design-system";
import { activityKindLabel, activityScopeLabel, formatActivityTime } from "../../history";

interface ActivitySectionProps {
  readonly showHeading?: boolean;
}

export function ActivitySection({ showHeading = true }: ActivitySectionProps) {
  const { activity, clearActivity, error, refreshActivity, status } = useActivity();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [clearReviewOpen, setClearReviewOpen] = useState(false);

  const filteredActivity = useMemo(
    () => (filter === "all" ? activity : activity.filter((record) => record.scope === filter)),
    [activity, filter]
  );
  const isBusy = status === "loading" || status === "recording" || status === "clearing";
  const countLabel =
    status === "loading"
      ? "Loading"
      : `${activity.length} ${activity.length === 1 ? "item" : "items"}`;

  const handleRetry = async () => {
    try {
      await refreshActivity();
    } catch {
      showToast({
        title: "Recent activity is still unavailable",
        message: "Your saved words and personal details are not affected.",
        tone: "error",
        dedupeKey: "activity-refresh-error"
      });
    }
  };

  const handleClear = async () => {
    try {
      const cleared = await clearActivity();
      setClearReviewOpen(false);
      showToast({
        title: "Recent activity cleared",
        message: `${cleared} local activity ${cleared === 1 ? "item" : "items"} removed.`,
        tone: "success",
        dedupeKey: "activity-cleared"
      });
    } catch {
      showToast({
        title: "Recent activity could not be cleared",
        message: "The activity list is unchanged. Reopen the app and try again.",
        tone: "error",
        dedupeKey: "activity-clear-error"
      });
    }
  };

  return (
    <div className="activity-section activity-section--focused">
      {showHeading ? (
        <header className="activity-section__intro">
          <div>
            <h3>Recent activity</h3>
            <p>A simple list of important actions saved only on this device.</p>
          </div>
          <span className="activity-section__count" aria-live="polite">
            {countLabel}
          </span>
        </header>
      ) : (
        <div className="activity-section__compact-summary" aria-live="polite">
          <span>{countLabel}</span>
          <span>Only on this device</span>
        </div>
      )}

      {error === undefined ? null : (
        <section className="activity-section__error" role="alert">
          <AppIcon name="warning" size={18} />
          <div>
            <strong>Recent activity needs a refresh.</strong>
            <p>
              We could not read a few older items. Your words, notes, settings, and backups are safe.
            </p>
            <Button
              disabled={isBusy}
              isLoading={status === "loading"}
              onClick={() => {
                void handleRetry();
              }}
              size="small"
              variant="secondary"
            >
              Try again
            </Button>
          </div>
        </section>
      )}

      <div className="activity-section__toolbar">
        <SelectField
          disabled={isBusy}
          label="Show"
          onChange={(event) => {
            setFilter(event.currentTarget.value as ActivityFilter);
          }}
          value={filter}
        >
          <option value="all">All actions</option>
          <option value="vocabulary">Words</option>
          <option value="library">Library</option>
          <option value="settings">Settings</option>
          <option value="backup">Backups</option>
          <option value="system">System</option>
        </SelectField>
        <p className="activity-section__privacy">
          <AppIcon name="check" size={17} />
          <span>Stored only on this device</span>
        </p>
      </div>

      {filteredActivity.length === 0 ? (
        <div className="activity-section__empty">
          <AppIcon name="book-open" size={22} />
          <div>
            <strong>Nothing to show here</strong>
            <p>Open a word or use the app to start building this list.</p>
          </div>
        </div>
      ) : (
        <ol aria-label="Recent local activity" className="activity-list activity-list--focused">
          {filteredActivity.map((record) => (
            <li className="activity-list__item" key={record.id}>
              <div className="activity-list__content">
                <strong>{record.label || activityKindLabel(record.kind)}</strong>
                <div className="activity-list__meta">
                  <span>{activityScopeLabel(record.scope)}</span>
                  {record.target === undefined ? null : <span>{record.target}</span>}
                  <time dateTime={record.occurredAt}>{formatActivityTime(record.occurredAt)}</time>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <section className="activity-clear-boundary activity-clear-boundary--focused">
        {clearReviewOpen ? (
          <div className="activity-clear-review">
            <div>
              <strong>Clear the activity list?</strong>
              <p>Your words, notes, settings, and backups will stay unchanged.</p>
            </div>
            <div className="activity-clear-review__actions">
              <Button
                disabled={isBusy}
                onClick={() => {
                  setClearReviewOpen(false);
                }}
                size="small"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                disabled={isBusy || activity.length === 0}
                isLoading={status === "clearing"}
                onClick={() => {
                  void handleClear();
                }}
                size="small"
                variant="danger"
              >
                Clear activity
              </Button>
            </div>
          </div>
        ) : (
          <div className="activity-clear-entry">
            <div>
              <strong>Clear recent activity</strong>
              <p>This removes only this activity list.</p>
            </div>
            <Button
              disabled={isBusy || activity.length === 0}
              onClick={() => {
                setClearReviewOpen(true);
              }}
              size="small"
              variant="ghost"
            >
              Clear activity
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
