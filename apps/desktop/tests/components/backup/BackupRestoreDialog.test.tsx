import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { BackupDescriptor } from "@platform/domain";

import { BackupRestoreDialog } from "../../../src/modules/backup/overlays";

const descriptor: BackupDescriptor = {
  fileName: "english-focus-backup-manual-20260715120000000.json",
  createdAt: "2026-07-15T12:00:00.000Z",
  reason: "manual",
  sizeBytes: 2048,
  backupVersion: "1.0.0",
  databaseSchemaVersion: "2",
  checksum: "0123456789abcdef",
  counts: {
    vocabularyEntries: 2,
    vocabularyMetadata: 2,
    settingsRecords: 1
  }
};

describe("BackupRestoreDialog", () => {
  it("renders saved backups and requires a check before restore", () => {
    const markup = renderToStaticMarkup(
      <BackupRestoreDialog
        backups={[descriptor]}
        busy={false}
        onClearRestoreResult={() => undefined}
        onClose={() => undefined}
        onDelete={async () => undefined}
        onRestore={async () => ({
          restoredAt: "2026-07-15T13:00:00.000Z",
          restored: descriptor.counts,
          sourceBackup: descriptor,
          safetyBackup: { ...descriptor, reason: "pre-restore" }
        })}
        onValidate={async () => ({ valid: true, issues: [], descriptor })}
        open
      />
    );

    expect(markup).toContain("Your backups");
    expect(markup).toContain("Manual");
    expect(markup).toContain("Check backup");
    expect(markup).toContain("Restore backup");
    expect(markup).toContain("disabled");
  });
});
