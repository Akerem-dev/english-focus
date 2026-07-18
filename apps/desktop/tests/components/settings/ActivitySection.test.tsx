import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../../src/app/providers";
import { ActivitySection } from "../../../src/modules/settings/components/ActivitySection";

const markup = renderToStaticMarkup(
  <AppProviders>
    <ActivitySection />
  </AppProviders>,
);

describe("ActivitySection", () => {
  it("renders a focused activity list without dashboard badges or a confirmation checkbox", () => {
    expect(markup).toContain("Recent activity");
    expect(markup).toContain("All actions");
    expect(markup).toContain("Stored only on this device");
    expect(markup).toContain("Clear activity");
    expect(markup).not.toContain("I understand this clears the activity list");
    expect(markup).not.toContain("not included in exports or backups");
  });
});
