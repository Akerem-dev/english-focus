import { useMemo, useState } from "react";
import type { ActivityFilter } from "@platform/domain";

import { useActivity, useToast } from "../../../app/providers";
import { Button, SelectField, StatusBadge } from "../../../components";
import { AppIcon } from "../../../design-system";
import { activityKindLabel, activityScopeLabel, formatActivityTime } from "../../history";

export function ActivitySection() {
  const { activity, clearActivity, error, status } = useActivity();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [confirmClear, setConfirmClear] = useState(false);

  const filteredActivity = useMemo(
    () => (filter === "all" ? activity : activity.filter((record) => record.scope === filter)),
    [activity, filter]
  );
  const isBusy = status === "loading" || status === "recording" || status === "clearing";

  const handleClear = async () => {
    try {
      const cleared = await clearActivity();
      setConfirmClear(false);
      showToast({
        title: "Recent activity cleared",
        message: `${cleared} local activity ${cleared === 1 ? "record" : "records"} removed.`,
        tone: "success",
        dedupeKey: "activity-cleared"
      });
    } catch {
      showToast({
        title: "Recent activity could not be cleared",
        message: "The local history remains unchanged. Try again after reopening the app.",
        tone: "error",
        dedupeKey: "activity-clear-error"
      });
    }
  };

  return (
    <div className="activity-section">
      <div className="activity-section__intro">
        <div>
          <h3>Recent activity</h3>
          <p>
            A short history of important actions saved on this device. Your word content, notes,
            imported text, and file locations are not included.
          </p>
        </div>
        <StatusBadge
          tone={error !== undefined ? "danger" : status === "loading" ? "neutral" : "success"}
        >
          {status === "loading"
            ? "Loading"
            : `${activity.length} ${activity.length === 1 ? "item" : "items"}`}
        </StatusBadge>
      </div>

      {error === undefined ? null : (
        <div className="activity-section__error" role="alert">
          <AppIcon name="warning" size={18} />
          <div>
            <strong>Some activity could not be shown.</strong>
            <p>
              Older history items may not work with this version. Your words and settings are
              unaffected.
            </p>
            <details className="activity-section__technical-error">
              <summary>Technical details</summary>
              <pre>{error}</pre>
            </details>
          </div>
        </div>
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
        <div className="activity-section__privacy">
          <AppIcon name="check" size={18} />
          <span>Saved only on this device · not included in exports or backups</span>
        </div>
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
        <ol aria-label="Recent local activity" className="activity-list">
          {filteredActivity.map((record) => (
            <li className="activity-list__item" key={record.id}>
              <span aria-hidden="true" className="activity-list__marker" />
              <div className="activity-list__content">
                <div className="activity-list__heading">
                  <strong>{record.label || activityKindLabel(record.kind)}</strong>
                  <StatusBadge>{activityScopeLabel(record.scope)}</StatusBadge>
                </div>
                <div className="activity-list__meta">
                  {record.target === undefined ? null : <span>{record.target}</span>}
                  <time dateTime={record.occurredAt}>{formatActivityTime(record.occurredAt)}</time>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="activity-clear-boundary">
        <div>
          <strong>Clear recent activity</strong>
          <p>
            This clears only the activity list. Your words, notes, settings, and backups stay
            unchanged.
          </p>
        </div>
        <label className="activity-clear-boundary__confirmation">
          <input
            checked={confirmClear}
            disabled={isBusy || activity.length === 0}
            onChange={(event) => {
              setConfirmClear(event.currentTarget.checked);
            }}
            type="checkbox"
          />
          <span>I understand this clears the activity list.</span>
        </label>
        <Button
          disabled={!confirmClear || isBusy || activity.length === 0}
          onClick={() => {
            void handleClear();
          }}
          size="small"
          variant="secondary"
        >
          {status === "clearing" ? "Clearing activity" : "Clear recent activity"}
        </Button>
      </div>
    </div>
  );
}
