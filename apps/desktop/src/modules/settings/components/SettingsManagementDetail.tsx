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
    description: "Review the small privacy-safe timeline stored only on this device."
  },
  diagnostics: {
    title: "System diagnostics",
    description: "Run a read-only health scan and review safe recovery guidance."
  },
  "local-data": {
    title: "Local data",
    description: "Review record counts and carefully remove only the data you choose."
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
        {view === "activity" ? <ActivitySection /> : null}
        {view === "diagnostics" ? <DiagnosticsSection /> : null}
        {view === "local-data" ? <LocalDataControlsSection /> : null}
      </div>
    </div>
  );
}
