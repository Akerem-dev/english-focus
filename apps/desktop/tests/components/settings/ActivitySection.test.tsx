import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../../src/app/providers";
import { ActivitySection } from "../../../src/modules/settings/components/ActivitySection";

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
});
