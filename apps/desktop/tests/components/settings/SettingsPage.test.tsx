import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../../src/app/providers";
import { SettingsPage } from "../../../src/modules/settings/pages";

describe("SettingsPage", () => {
  it("renders simplified content, data, appearance, backup, instruction, and diagnostics settings", () => {
    const markup = renderToStaticMarkup(
      <AppProviders>
        <SettingsPage />
      </AppProviders>
    );

    expect(markup).toContain("Settings");
    expect(markup).toContain("Show etymology");
    expect(markup).toContain("Example sentences shown");
    expect(markup).toContain("First 3");
    expect(markup).not.toContain("Show common mistakes");
    expect(markup).not.toContain("Include word family");
    expect(markup).not.toContain("Include common mistakes");
    expect(markup).not.toContain("Editorially reviewed");
    expect(markup).not.toContain("Learning status");
    expect(markup).toContain("Core vocabulary");
    expect(markup).toContain("1.0.0-reviewed.1");
    expect(markup).toContain("Read-only · local");
    expect(markup).toContain("Automatic backups");
    expect(markup).toContain("Create backup now");
    expect(markup).toContain("Manage backups");
    expect(markup).toContain("Reduced motion");
    expect(markup).toContain("AI instruction");
    expect(markup).toContain("Include grammar notes");
    expect(markup).toContain("Include etymology");
    expect(markup).toContain("Include usage tips");
    expect(markup).toContain("Run diagnostics");
    expect(markup).toContain("Local database health");
    expect(markup).toContain("Privacy &amp; activity");
    expect(markup).toContain("Recent activity");
    expect(markup).toContain("excluded from exports and backups");
    expect(markup).toContain("Local data reset");
    expect(markup).toContain("Review full local reset");
    expect(markup).toContain("Loading settings");
  });
});
