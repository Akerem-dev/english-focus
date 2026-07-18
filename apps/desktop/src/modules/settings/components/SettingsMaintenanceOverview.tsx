import { Button } from "../../../components";
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
    <article className="settings-management-card" data-tone={tone}>
      <span aria-hidden="true" className="settings-management-card__icon">
        <AppIcon name={icon} size={20} />
      </span>
      <div className="settings-management-card__copy">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <span className="settings-management-card__meta">{meta}</span>
      </div>
      <Button onClick={onOpen} size="small" variant={tone === "danger" ? "danger" : "secondary"}>
        {actionLabel}
      </Button>
    </article>
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
