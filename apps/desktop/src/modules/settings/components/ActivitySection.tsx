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
            A short local record of important actions. Personal notes, definitions, pasted JSON, and
            file paths are never stored here.
          </p>
        </div>
        <StatusBadge
          tone={error !== undefined ? "danger" : status === "loading" ? "neutral" : "success"}
        >
          {status === "loading" ? "Loading" : `${activity.length} recent`}
        </StatusBadge>
      </div>

      {error === undefined ? null : (
        <div className="activity-section__error" role="alert">
          <AppIcon name="warning" size={18} />
          <div>
            <strong>Recent activity needs attention.</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="activity-section__toolbar">
        <SelectField
          disabled={isBusy}
          label="Activity area"
          onChange={(event) => {
            setFilter(event.currentTarget.value as ActivityFilter);
          }}
          value={filter}
        >
          <option value="all">All activity</option>
          <option value="vocabulary">Vocabulary</option>
          <option value="library">Library</option>
          <option value="settings">Settings</option>
          <option value="backup">Backup</option>
          <option value="system">System</option>
        </SelectField>
        <div className="activity-section__privacy">
          <AppIcon name="check" size={18} />
          <span>Stored only in this app · excluded from exports and backups</span>
        </div>
      </div>

      {filteredActivity.length === 0 ? (
        <div className="activity-section__empty">
          <AppIcon name="book-open" size={22} />
          <div>
            <strong>No activity in this view</strong>
            <p>Open a vocabulary entry or complete a local action to create a history item.</p>
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
            This removes only the local activity timeline. Vocabulary, study details, settings, and
            backups are not changed.
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
          <span>I understand this clears the retained activity timeline.</span>
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
