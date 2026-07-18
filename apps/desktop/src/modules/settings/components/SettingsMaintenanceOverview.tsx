import { AppIcon, type AppIconName } from "../../../design-system";

export type SettingsManagementView = "activity" | "diagnostics" | "local-data";

interface SettingsMaintenanceOverviewProps {
  readonly activitySummary: string;
  readonly onOpen: (view: SettingsManagementView) => void;
}

interface MaintenanceCardProps {
  readonly actionLabel: string;
  readonly description: string;
  readonly icon: AppIconName;
  readonly meta: string;
  readonly onOpen: () => void;
  readonly title: string;
  readonly tone?: "default" | "danger";
}

function MaintenanceCard({
  actionLabel,
  description,
  icon,
  meta,
  onOpen,
  title,
  tone = "default"
}: MaintenanceCardProps) {
  return (
    <button
      className="settings-management-card"
      data-settings-management-trigger
      data-tone={tone}
      onClick={onOpen}
      type="button"
    >
      <span aria-hidden="true" className="settings-management-card__icon">
        <AppIcon name={icon} size={20} />
      </span>
      <span className="settings-management-card__copy">
        <span>
          <strong className="settings-management-card__title">{title}</strong>
          <span className="settings-management-card__description">{description}</span>
        </span>
        <span className="settings-management-card__meta">{meta}</span>
      </span>
      <span className="settings-management-card__action">
        {actionLabel}
        <span aria-hidden="true">→</span>
      </span>
    </button>
  );
}

export function SettingsMaintenanceOverview({
  activitySummary,
  onOpen
}: SettingsMaintenanceOverviewProps) {
  return (
    <section aria-label="Privacy and maintenance tools" className="settings-management-overview">
      <MaintenanceCard
        actionLabel="View activity"
        description="Review the privacy-safe timeline stored only inside English Focus."
        icon="book-open"
        meta={activitySummary}
        onOpen={() => onOpen("activity")}
        title="Recent activity"
      />
      <MaintenanceCard
        actionLabel="Run diagnostics"
        description="Check SQLite integrity, recovery readiness, and local data consistency."
        icon="settings"
        meta="Read-only until maintenance is approved"
        onOpen={() => onOpen("diagnostics")}
        title="System diagnostics"
      />
      <MaintenanceCard
        actionLabel="Manage local data"
        description="Remove selected local records or review a guarded full local reset."
        icon="warning"
        meta="Bundled vocabulary is always protected"
        onOpen={() => onOpen("local-data")}
        title="Local data"
        tone="danger"
      />
    </section>
  );
}
