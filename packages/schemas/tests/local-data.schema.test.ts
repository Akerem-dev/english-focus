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

describe("local data schemas", () => {
  it("accepts a non-negative local data snapshot", () => {
    expect(localDataSnapshotSchema.parse(emptySnapshot)).toEqual(emptySnapshot);
  });

  it("treats a desktop null safety backup as no recovery copy", () => {
    expect(
      resetLocalDataResultSchema.parse({
        deleted: emptySnapshot,
        safetyBackup: null
      })
    ).toEqual({
      deleted: emptySnapshot,
      safetyBackup: undefined
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
