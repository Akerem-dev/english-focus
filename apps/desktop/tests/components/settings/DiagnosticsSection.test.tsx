import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../../src/app/providers";
import { DiagnosticsSection } from "../../../src/modules/settings/components/DiagnosticsSection";

const markup = renderToStaticMarkup(
  <AppProviders>
    <DiagnosticsSection />
  </AppProviders>,
);

describe("DiagnosticsSection", () => {
  it("starts as a short user-facing health check", () => {
    expect(markup).toContain("Check your app");
    expect(markup).toContain("Check now");
    expect(markup).toContain("No check has been run yet");
    expect(markup).toContain("read-only");
  });

  it("does not expose database language or dashboard metrics before a check", () => {
    expect(markup).not.toContain("SQLite integrity");
    expect(markup).not.toContain("Database schema");
    expect(markup).not.toContain("WAL journaling");
    expect(markup).not.toContain("Diagnostic record counts");
    expect(markup).not.toContain("What was checked");
  });
});
