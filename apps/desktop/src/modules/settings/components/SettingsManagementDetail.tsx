import { useEffect, useRef } from "react";

import { Button } from "../../../components";
import { ActivitySection } from "./ActivitySection";
import { DiagnosticsSection } from "./DiagnosticsSection";
import { LocalDataControlsSection } from "./LocalDataControlsSection";
import type { SettingsManagementView } from "./SettingsMaintenanceOverview";

const MANAGEMENT_VIEW_DETAILS: Record<
  SettingsManagementView,
  { readonly title: string; readonly description: string }
> = {
  activity: {
    title: "Recent activity",
    description: "See the words and app actions you used recently. This history stays on this device."
  },
  diagnostics: {
    title: "App health",
    description: "Check whether your local words, settings, and backups are working normally."
  },
  "local-data": {
    title: "My data",
    description: "Review what is stored on this device and remove only what you choose."
  }
};

interface SettingsManagementViewProps {
  readonly onBack: () => void;
  readonly view: SettingsManagementView;
}

export function SettingsManagementDetail({ onBack, view }: SettingsManagementViewProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const details = MANAGEMENT_VIEW_DETAILS[view];

  useEffect(() => {
    headingRef.current?.focus();
  }, [view]);

  return (
    <div className="settings-management-view">
      <header className="settings-management-view__header">
        <Button onClick={onBack} size="small" variant="ghost">
          ← Back to privacy & maintenance
        </Button>
        <div>
          <p className="route-page__eyebrow">Privacy & maintenance</p>
          <h2 ref={headingRef} tabIndex={-1}>
            {details.title}
          </h2>
          <p>{details.description}</p>
        </div>
      </header>
      <div className="settings-management-view__body">
        {view === "activity" ? <ActivitySection showHeading={false} /> : null}
        {view === "diagnostics" ? <DiagnosticsSection /> : null}
        {view === "local-data" ? <LocalDataControlsSection showHeading={false} /> : null}
      </div>
    </div>
  );
}
