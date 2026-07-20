import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ActivityContext,
  type ActivityContextValue
} from "../../../src/app/providers/ActivityContext";
import { AppProviders } from "../../../src/app/providers";
import { ActivitySection } from "../../../src/modules/settings/components/ActivitySection";

const activityRecord = Object.freeze({
  id: "activity-1",
  kind: "vocabulary-viewed" as const,
  scope: "vocabulary" as const,
  label: "Viewed vocabulary entry",
  target: "maintain",
  occurredAt: "2026-07-20T18:00:00.000Z"
});
const activity = Object.freeze([activityRecord]);

const readyContext: ActivityContextValue = {
  activity,
  status: "ready",
  error: undefined,
  refreshActivity: async () => activity,
  recordActivity: async () => activityRecord,
  clearActivity: async () => 0
};

function renderWithActivity(value: ActivityContextValue): string {
  return renderToStaticMarkup(
    <AppProviders>
      <ActivityContext.Provider value={value}>
        <ActivitySection />
      </ActivityContext.Provider>
    </AppProviders>
  );
}

describe("ActivitySection", () => {
  it("renders a focused activity list without filters or technical language", () => {
    const markup = renderToStaticMarkup(
      <AppProviders>
        <ActivitySection />
      </AppProviders>
    );

    expect(markup).toContain("Recent activity");
    expect(markup).toContain("See the words and app actions you used recently");
    expect(markup).toContain("Clear activity");
    expect(markup).not.toContain("All actions");
    expect(markup).not.toContain('label="Show"');
    expect(markup).not.toContain("Technical details");
    expect(markup).not.toContain("I understand this clears the activity list");
    expect(markup).not.toContain("not included in exports or backups");
  });

  it("omits the repeated heading inside the focused management screen", () => {
    const markup = renderToStaticMarkup(
      <AppProviders>
        <ActivitySection showHeading={false} />
      </AppProviders>
    );

    expect(markup).not.toContain("<h3>Recent activity</h3>");
    expect(markup).toContain("Saved only on this device");
  });

  it("keeps valid activity visible when only older malformed rows were skipped", () => {
    const markup = renderWithActivity({
      ...readyContext,
      error: "1 older activity record could not be shown."
    });

    expect(markup).toContain("Some older activity could not be shown.");
    expect(markup).toContain("maintain");
    expect(markup).not.toContain("Try again");
    expect(markup).not.toContain("invalid_type");
  });

  it("shows retry guidance instead of an empty state when loading completely fails", () => {
    const markup = renderWithActivity({
      ...readyContext,
      activity: Object.freeze([]),
      error: "Recent activity could not be loaded.",
      status: "error"
    });

    expect(markup).toContain("Recent activity is unavailable right now.");
    expect(markup).toContain("Try again");
    expect(markup).not.toContain("No recent activity yet");
    expect(markup).not.toContain("Recent activity could not be loaded.");
  });
});
