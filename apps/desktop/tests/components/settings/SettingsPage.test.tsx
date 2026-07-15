import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../../src/app/providers";
import { SettingsPage } from "../../../src/modules/settings/pages";

describe("SettingsPage", () => {
  it("renders persistent content, data, appearance, backup, instruction, and diagnostics settings", () => {
    const markup = renderToStaticMarkup(
      <AppProviders>
        <SettingsPage />
      </AppProviders>
    );

    expect(markup).toContain("Settings");
    expect(markup).toContain("Show etymology");
    expect(markup).toContain("Automatic backups");
    expect(markup).toContain("Create backup now");
    expect(markup).toContain("Manage backups");
    expect(markup).toContain("Reduced motion");
    expect(markup).toContain("AI instruction");
    expect(markup).toContain("Settings schema");
    expect(markup).toContain("Loading settings");
  });
});
