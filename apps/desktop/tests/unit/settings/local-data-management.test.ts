import { describe, expect, it } from "vitest";

import {
  FULL_LOCAL_RESET_CATEGORIES,
  RESET_APPLICATION_CONFIRMATION,
  canCreateSafetyBackup,
  isFullResetConfirmation,
  selectedLocalDataCount
} from "../../../src/modules/settings/application";

const snapshot = {
  studyMetadataRecords: 4,
  userVocabularyEntries: 3,
  overrideVocabularyEntries: 2,
  settingsRecords: 1,
  activityRecords: 9,
  backupFiles: 5
};

describe("local data management safeguards", () => {
  it("keeps saved backups outside a normal full application reset", () => {
    expect(FULL_LOCAL_RESET_CATEGORIES).not.toContain("backups");
    expect(FULL_LOCAL_RESET_CATEGORIES).toEqual([
      "study-metadata",
      "user-vocabulary",
      "overrides",
      "settings",
      "activity"
    ]);
  });

  it("uses typed confirmation only for the full reset flow", () => {
    expect(RESET_APPLICATION_CONFIRMATION).toBe("RESET ENGLISH FOCUS");
    expect(isFullResetConfirmation("RESET ENGLISH FOCUS")).toBe(true);
    expect(isFullResetConfirmation(" RESET ENGLISH FOCUS ")).toBe(true);
    expect(isFullResetConfirmation("DELETE SELECTED DATA")).toBe(false);
  });

  it("offers recovery copies only when saved backups are preserved", () => {
    expect(canCreateSafetyBackup(["settings", "study-metadata"])).toBe(true);
    expect(canCreateSafetyBackup(["activity"])).toBe(false);
    expect(canCreateSafetyBackup(["settings", "backups"])).toBe(false);
  });

  it("totals the selected data groups", () => {
    expect(selectedLocalDataCount(snapshot, ["user-vocabulary", "activity"])).toBe(12);
  });
});
