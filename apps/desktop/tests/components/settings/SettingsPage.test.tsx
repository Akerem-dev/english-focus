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
    expect(markup).toContain('aria-orientation="vertical"');
    expect(markup).toContain('role="tabpanel"');
    expect(markup).toContain('id="settings-category-panel"');
  });

  it("uses a roving tab stop with vocabulary content selected by default", () => {
    expect(markup).toContain('id="settings-category-tab-content" role="tab" tabindex="0"');
    expect(markup).toContain('id="settings-category-tab-general" role="tab" tabindex="-1"');
    expect(markup).toContain('aria-labelledby="settings-category-tab-content"');
  });

  it("renders the selected category as one direct preference surface", () => {
    expect(markup).toContain('class="settings-preference-list"');
    expect(markup).toContain('aria-label="Vocabulary content preferences"');
    expect(markup).not.toContain('class="settings-panel"');
    expect(markup).not.toContain('class="settings-panel__body"');
  });

  it("opens the focused vocabulary content category by default", () => {
    expect(markup).toContain("Show etymology");
    expect(markup).toContain("Example sentences shown");
    expect(markup).toContain("First 3");
    expect(markup).toContain("Target proficiency");
    expect(markup).toContain("Explanation language");
    expect(markup).toContain("Turkish");
    expect(markup).toContain("Explanation detail");
    expect(markup).toContain("Concise");
    expect(markup).toContain("Balanced");
    expect(markup).toContain("Detailed");
    expect(markup).toContain("Advanced customization");
    expect(markup).not.toContain(">Maximum<");
    expect(markup).not.toContain("Appearance &amp; accessibility");
    expect(markup).not.toContain("Automatic backups");
    expect(markup).not.toContain("Local database health");
    expect(markup).not.toContain("Review full local reset");
  });

  it("moves compact application information below the primary workspace", () => {
    expect(markup).toContain('class="settings-about-footer"');
    expect(markup).toContain("About this app");
    expect(markup).toContain("English Focus");
    expect(markup).toContain("1.0.0");
    expect(markup).toContain("Local SQLite storage");
    expect(markup).toContain("View version details");
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
