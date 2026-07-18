import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../../src/app/providers";
import { SettingsPage } from "../../../src/modules/settings/pages";

const markup = renderToStaticMarkup(
  <AppProviders>
    <SettingsPage />
  </AppProviders>
);

describe("SettingsPage", () => {
  it("renders the premium four-category settings workspace", () => {
    expect(markup).toContain("Settings");
    expect(markup).toContain("General");
    expect(markup).toContain("Vocabulary content");
    expect(markup).toContain("Data &amp; backups");
    expect(markup).toContain("Privacy &amp; maintenance");
    expect(markup).toContain('role="tablist"');
    expect(markup).toContain('role="tabpanel"');
  });

  it("opens the focused vocabulary content category by default", () => {
    expect(markup).toContain("Vocabulary display");
    expect(markup).toContain("Show etymology");
    expect(markup).toContain("Example sentences shown");
    expect(markup).toContain("First 3");
    expect(markup).toContain("Explanation preferences");
    expect(markup).toContain("Include grammar notes");
    expect(markup).not.toContain("Appearance &amp; accessibility");
    expect(markup).not.toContain("Automatic backups");
    expect(markup).not.toContain("Local database health");
    expect(markup).not.toContain("Review full local reset");
  });

  it("removes technical ready chips from the primary settings experience", () => {
    expect(markup).not.toContain("SQLite settings ready");
    expect(markup).not.toContain("Local retention ready");
    expect(markup).not.toContain("Saved locally");
    expect(markup).toContain("Loading local settings");
  });

  it("keeps obsolete vocabulary controls hidden", () => {
    expect(markup).not.toContain("Show common mistakes");
    expect(markup).not.toContain("Include word family");
    expect(markup).not.toContain("Editorially reviewed");
    expect(markup).not.toContain("Learning status");
  });
});
