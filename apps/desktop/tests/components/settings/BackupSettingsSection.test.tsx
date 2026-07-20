import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../../src/app/providers";
import { BackupSettingsSection } from "../../../src/modules/settings/components";

const markup = renderToStaticMarkup(
  <AppProviders>
    <BackupSettingsSection />
  </AppProviders>
);

describe("BackupSettingsSection", () => {
  it("uses a flat summary instead of nested statistic cards", () => {
    expect(markup).toContain('class="backup-settings-inline"');
    expect(markup).toContain('class="backup-settings-inline__facts"');
    expect(markup).toContain("Saved backups");
    expect(markup).toContain("Most recent backup");
    expect(markup).not.toContain('class="backup-settings-summary"');
  });

  it("guides a new user toward one clear first backup action", () => {
    expect(markup).toContain("Create your first backup");
    expect(markup).toContain("Create first backup");
    expect(markup).toContain("A backup is optional");
    expect(markup).not.toContain("Manage backups");
    expect(markup).not.toContain("View backups");
  });
});
