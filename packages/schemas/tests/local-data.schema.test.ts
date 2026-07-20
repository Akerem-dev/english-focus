import { describe, expect, it } from "vitest";

import { localDataSnapshotSchema, resetLocalDataResultSchema } from "../src";

const emptySnapshot = {
  studyMetadataRecords: 0,
  userVocabularyEntries: 0,
  overrideVocabularyEntries: 0,
  settingsRecords: 0,
  activityRecords: 0,
  backupFiles: 0
};

const noBackupDeletion = {
  requested: false,
  deletedFiles: 0,
  failedFiles: 0
};

describe("local data schemas", () => {
  it("accepts a non-negative local data snapshot", () => {
    expect(localDataSnapshotSchema.parse(emptySnapshot)).toEqual(emptySnapshot);
  });

  it("normalizes older desktop results without cleanup details", () => {
    expect(
      resetLocalDataResultSchema.parse({
        deleted: emptySnapshot,
        safetyBackup: null
      })
    ).toEqual({
      deleted: emptySnapshot,
      safetyBackup: undefined,
      backupDeletion: noBackupDeletion
    });
  });

  it("preserves committed counts when backup cleanup is partial", () => {
    expect(
      resetLocalDataResultSchema.parse({
        deleted: { ...emptySnapshot, settingsRecords: 1, backupFiles: 2 },
        safetyBackup: null,
        backupDeletion: {
          requested: true,
          deletedFiles: 2,
          failedFiles: 1
        }
      })
    ).toEqual({
      deleted: { ...emptySnapshot, settingsRecords: 1, backupFiles: 2 },
      safetyBackup: undefined,
      backupDeletion: {
        requested: true,
        deletedFiles: 2,
        failedFiles: 1
      }
    });
  });

  it("rejects impossible negative deletion counts", () => {
    expect(() =>
      resetLocalDataResultSchema.parse({
        deleted: { ...emptySnapshot, activityRecords: -1 }
      })
    ).toThrow();
  });
});
