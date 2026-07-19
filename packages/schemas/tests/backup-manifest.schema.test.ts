import { describe, expect, it } from "vitest";

import {
  backupDescriptorSchema,
  backupRestoreResultSchema,
  backupValidationResultSchema,
  unavailableBackupSchema,
} from "../src/backup";

const descriptor = {
  fileName: "english-focus-backup-manual-20260715120000000.json",
  createdAt: "2026-07-15T12:00:00.000Z",
  reason: "manual",
  sizeBytes: 2048,
  backupVersion: "1.0.0",
  databaseSchemaVersion: "3",
  checksum: "0123456789abcdef",
  counts: {
    vocabularyEntries: 2,
    vocabularyMetadata: 2,
    settingsRecords: 1,
  },
};

describe("backup schemas", () => {
  it("accepts current and legacy database schema descriptors", () => {
    expect(backupDescriptorSchema.parse(descriptor)).toEqual(descriptor);
    expect(
      backupDescriptorSchema.parse({
        ...descriptor,
        databaseSchemaVersion: "2",
      }),
    ).toMatchObject({
      databaseSchemaVersion: "2",
    });
  });

  it("accepts versioned descriptors, validation results, and restore results", () => {
    expect(backupDescriptorSchema.parse(descriptor)).toEqual(descriptor);
    expect(
      backupValidationResultSchema.parse({
        valid: true,
        issues: [],
        descriptor,
      }),
    ).toMatchObject({ valid: true });
    expect(
      backupRestoreResultSchema.parse({
        restoredAt: "2026-07-15T13:00:00.000Z",
        restored: descriptor.counts,
        sourceBackup: descriptor,
        safetyBackup: { ...descriptor, reason: "pre-restore" },
      }),
    ).toMatchObject({ restoredAt: "2026-07-15T13:00:00.000Z" });
  });

  it("accepts a safe unavailable-backup summary without exposing parser details", () => {
    const unavailable = {
      fileName: "damaged.json",
      sizeBytes: 128,
      issue: "This backup file is incomplete or damaged.",
    };

    expect(unavailableBackupSchema.parse(unavailable)).toEqual(unavailable);
  });

  it("rejects malformed checksums and unsupported schema versions", () => {
    expect(
      backupDescriptorSchema.safeParse({ ...descriptor, checksum: "broken" })
        .success,
    ).toBe(false);
    expect(
      backupDescriptorSchema.safeParse({
        ...descriptor,
        databaseSchemaVersion: "99",
      }).success,
    ).toBe(false);
  });
});
