import { useState } from "react";

import { useActivity, useToast } from "../../../app/providers";
import { Button } from "../../../components";
import { AppIcon } from "../../../design-system";
import { activityKindLabel, activityScopeLabel, formatActivityTime } from "../../history";

interface ActivitySectionProps {
  readonly showHeading?: boolean;
}

export function ActivitySection({ showHeading = true }: ActivitySectionProps) {
  const { activity, clearActivity, error, status } = useActivity();
  const { showToast } = useToast();
  const [clearReviewOpen, setClearReviewOpen] = useState(false);

  const isBusy = status === "loading" || status === "recording" || status === "clearing";
  const countLabel =
    status === "loading"
      ? "Loading"
      : `${activity.length} ${activity.length === 1 ? "item" : "items"}`;

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
            <p>See the words and app actions you used recently.</p>
          </div>
          <span className="activity-section__count" aria-live="polite">
            {countLabel}
          </span>
        </header>
      ) : (
        <div className="activity-section__compact-summary" aria-live="polite">
          <span>{countLabel}</span>
          <span>Saved only on this device</span>
        </div>
      )}

      {error === undefined ? null : (
        <section className="activity-section__error" role="alert">
          <AppIcon name="warning" size={18} />
          <div>
            <strong>Some older activity could not be shown.</strong>
            <p>
              Your words, notes, settings, and backups are safe. You can keep using the app normally.
            </p>
          </div>
        </section>
      )}

      {activity.length === 0 ? (
        <div className="activity-section__empty">
          <AppIcon name="book-open" size={22} />
          <div>
            <strong>No recent activity yet</strong>
            <p>Open a word or use the app and your recent actions will appear here.</p>
          </div>
        </div>
      ) : (
        <ol aria-label="Recent local activity" className="activity-list activity-list--focused">
          {activity.map((record) => (
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
