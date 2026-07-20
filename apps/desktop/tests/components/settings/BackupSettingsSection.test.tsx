import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { UnavailableBackup } from "@platform/domain";

import { AppProviders } from "../../../src/app/providers";
import {
  BackupSettingsSection,
  UnavailableBackupFiles
} from "../../../src/modules/settings/components";

const markup = renderToStaticMarkup(
  <AppProviders>
    <BackupSettingsSection />
  </AppProviders>
);

const unavailable: UnavailableBackup = {
  fileName: "english-focus-backup-manual-damaged.json",
  sizeBytes: 128,
  issue: "This backup file is incomplete or damaged."
};

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

  it("shows damaged backup files separately with only a removal action", () => {
    const unavailableMarkup = renderToStaticMarkup(
      <UnavailableBackupFiles busy={false} files={[unavailable]} onRemove={async () => undefined} />
    );

    expect(unavailableMarkup).toContain("Files that need attention");
    expect(unavailableMarkup).toContain(unavailable.fileName);
    expect(unavailableMarkup).toContain(unavailable.issue);
    expect(unavailableMarkup).toContain(">Remove<");
    expect(unavailableMarkup).not.toContain("Restore backup");
    expect(unavailableMarkup).not.toContain("Check backup");
  });
});
