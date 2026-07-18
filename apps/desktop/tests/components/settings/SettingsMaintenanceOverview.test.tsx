import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SettingsMaintenanceOverview } from "../../../src/modules/settings/components";

const markup = renderToStaticMarkup(
  <SettingsMaintenanceOverview activitySummary="42 recent events" onOpen={vi.fn()} />
);

describe("SettingsMaintenanceOverview", () => {
  it("keeps privacy and maintenance actions concise", () => {
    expect(markup).toContain("Recent activity");
    expect(markup).toContain("System diagnostics");
    expect(markup).toContain("Local data");
    expect(markup).toContain("42 recent events");
    expect(markup).toContain("View activity");
    expect(markup).toContain("Run diagnostics");
    expect(markup).toContain("Manage local data");
  });

  it("does not dump secondary management interfaces into the overview", () => {
    expect(markup).not.toContain("Health checks");
    expect(markup).not.toContain("Activity area");
    expect(markup).not.toContain("Choose data to remove");
    expect(markup).not.toContain("Review full local reset");
  });
});
