import { describe, expect, it } from "vitest";
import type { BackupDescriptor } from "@platform/domain";

import {
  isAutomaticBackupDue,
  selectBackupsForRetentionDeletion
} from "../../../src/modules/backup/application";

function backup(
  fileName: string,
  reason: BackupDescriptor["reason"],
  createdAt: string
): BackupDescriptor {
  return {
    fileName,
    reason,
    createdAt,
    sizeBytes: 512,
    backupVersion: "1.0.0",
    databaseSchemaVersion: "2",
    checksum: "0123456789abcdef",
    counts: {
      vocabularyEntries: 2,
      vocabularyMetadata: 2,
      settingsRecords: 1
    }
  };
}

describe("backup retention and scheduling", () => {
  it("keeps manual backups while trimming old automatic and pre-restore backups", () => {
    const backups = [
      ...Array.from({ length: 9 }, (_, index) =>
        backup(
          `automatic-${index}.json`,
          "automatic",
          `2026-07-${String(20 - index).padStart(2, "0")}T10:00:00.000Z`
        )
      ),
      ...Array.from({ length: 7 }, (_, index) =>
        backup(
          `safety-${index}.json`,
          "pre-restore",
          `2026-06-${String(20 - index).padStart(2, "0")}T10:00:00.000Z`
        )
      ),
      backup("manual.json", "manual", "2026-01-01T10:00:00.000Z")
    ];

    const deletions = selectBackupsForRetentionDeletion(backups);

    expect(deletions.filter((item) => item.reason === "automatic")).toHaveLength(2);
    expect(deletions.filter((item) => item.reason === "pre-restore")).toHaveLength(2);
    expect(deletions.some((item) => item.reason === "manual")).toBe(false);
  });

  it("creates an automatic backup only when the configured interval is due", () => {
    const latest = backup("automatic.json", "automatic", "2026-07-14T12:00:00.000Z");

    expect(isAutomaticBackupDue([latest], "daily", new Date("2026-07-15T13:00:00.000Z"))).toBe(
      true
    );
    expect(isAutomaticBackupDue([latest], "weekly", new Date("2026-07-15T13:00:00.000Z"))).toBe(
      false
    );
    expect(isAutomaticBackupDue([], "manual", new Date("2026-07-15T13:00:00.000Z"))).toBe(false);
  });
});
