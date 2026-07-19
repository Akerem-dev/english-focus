import { describe, expect, it } from "vitest";
import type { BackupDescriptor } from "@platform/domain";

import {
  automaticBackupDelayMs,
  automaticBackupRetryDelayMs,
  findCreatedBackup,
  isAutomaticBackupDue,
  selectBackupsForRetentionDeletion,
} from "../../../src/modules/backup/application";

function backup(
  fileName: string,
  reason: BackupDescriptor["reason"],
  createdAt: string,
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
      settingsRecords: 1,
    },
  };
}

describe("backup retention and scheduling", () => {
  it("keeps manual backups while trimming old automatic and pre-restore backups", () => {
    const backups = [
      ...Array.from({ length: 9 }, (_, index) =>
        backup(
          `automatic-${index}.json`,
          "automatic",
          `2026-07-${String(20 - index).padStart(2, "0")}T10:00:00.000Z`,
        ),
      ),
      ...Array.from({ length: 7 }, (_, index) =>
        backup(
          `safety-${index}.json`,
          "pre-restore",
          `2026-06-${String(20 - index).padStart(2, "0")}T10:00:00.000Z`,
        ),
      ),
      backup("manual.json", "manual", "2026-01-01T10:00:00.000Z"),
    ];

    const deletions = selectBackupsForRetentionDeletion(backups);

    expect(
      deletions.filter((item) => item.reason === "automatic"),
    ).toHaveLength(2);
    expect(
      deletions.filter((item) => item.reason === "pre-restore"),
    ).toHaveLength(2);
    expect(deletions.some((item) => item.reason === "manual")).toBe(false);
  });

  it("calculates the next automatic backup delay instead of checking only at startup", () => {
    const latest = backup(
      "automatic.json",
      "automatic",
      "2026-07-14T12:00:00.000Z",
    );

    expect(
      automaticBackupDelayMs([], "daily", new Date("2026-07-15T13:00:00.000Z")),
    ).toBe(0);
    expect(
      automaticBackupDelayMs(
        [latest],
        "daily",
        new Date("2026-07-14T13:00:00.000Z"),
      ),
    ).toBe(23 * 60 * 60 * 1_000);
    expect(
      automaticBackupDelayMs(
        [latest],
        "weekly",
        new Date("2026-07-15T13:00:00.000Z"),
      ),
    ).toBe(6 * 24 * 60 * 60 * 1_000 - 60 * 60 * 1_000);
    expect(
      automaticBackupDelayMs(
        [],
        "manual",
        new Date("2026-07-15T13:00:00.000Z"),
      ),
    ).toBe(undefined);
  });

  it("reports an automatic backup as due when its calculated delay reaches zero", () => {
    const latest = backup(
      "automatic.json",
      "automatic",
      "2026-07-14T12:00:00.000Z",
    );

    expect(
      isAutomaticBackupDue(
        [latest],
        "daily",
        new Date("2026-07-15T13:00:00.000Z"),
      ),
    ).toBe(true);
    expect(
      isAutomaticBackupDue(
        [latest],
        "weekly",
        new Date("2026-07-15T13:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("uses a bounded retry schedule after automatic backup failures", () => {
    expect(automaticBackupRetryDelayMs(1)).toBe(60_000);
    expect(automaticBackupRetryDelayMs(2)).toBe(5 * 60_000);
    expect(automaticBackupRetryDelayMs(3)).toBe(15 * 60_000);
    expect(automaticBackupRetryDelayMs(20)).toBe(60 * 60_000);
  });

  it("recovers a backup that was written before retention cleanup failed", () => {
    const createdAt = "2026-07-15T12:00:00.000Z";
    const created = backup("automatic.json", "automatic", createdAt);

    expect(findCreatedBackup([created], "automatic", createdAt)).toEqual(
      created,
    );
    expect(findCreatedBackup([created], "manual", createdAt)).toBeUndefined();
  });
});
