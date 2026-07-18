import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../../src/app/providers";
import { DiagnosticsSection } from "../../../src/modules/settings/components/DiagnosticsSection";

describe("DiagnosticsSection", () => {
  it("starts with one clear user-facing action", () => {
    const markup = renderToStaticMarkup(
      <AppProviders>
        <DiagnosticsSection />
      </AppProviders>
    );

    expect(markup).toContain("App health");
    expect(markup).toContain("Check app health");
    expect(markup).toContain("No check has been run yet");
    expect(markup).toContain("does not change or upload anything");
    expect(markup).not.toContain("SQLite integrity");
    expect(markup).not.toContain("Database schema");
    expect(markup).not.toContain("WAL journaling");
    expect(markup).not.toContain("Diagnostic record counts");
  });

  it("does not repeat the page heading inside a focused management view", () => {
    const markup = renderToStaticMarkup(
      <AppProviders>
        <DiagnosticsSection showHeading={false} />
      </AppProviders>
    );

    expect(markup).not.toContain("<strong>App health</strong>");
    expect(markup).toContain("Check app health");
  });
});
