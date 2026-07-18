import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SettingsMaintenanceOverview } from "../../../src/modules/settings/components";

const markup = renderToStaticMarkup(
  <SettingsMaintenanceOverview activitySummary="42 recent events" onOpen={vi.fn()} />
);

describe("SettingsMaintenanceOverview", () => {
  it("keeps privacy and maintenance actions concise", () => {
    expect(markup).toContain("Recent activity");
    expect(markup).toContain("App health");
    expect(markup).toContain("My data");
    expect(markup).toContain("42 recent events");
    expect(markup).toContain("View activity");
    expect(markup).toContain("Check app health");
    expect(markup).toContain("Manage my data");
  });

  it("does not dump secondary management interfaces into the overview", () => {
    expect(markup).not.toContain("What was checked");
    expect(markup).not.toContain("Show");
    expect(markup).not.toContain("Choose what to remove");
    expect(markup).not.toContain("Reset the app");
  });
});
