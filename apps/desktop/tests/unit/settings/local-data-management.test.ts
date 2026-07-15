import { describe, expect, it } from "vitest";

import {
  FULL_LOCAL_RESET_CATEGORIES,
  canCreateSafetyBackup,
  requiredLocalDataConfirmation,
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
  it("requires the strongest phrase for a full local reset", () => {
    expect(requiredLocalDataConfirmation(FULL_LOCAL_RESET_CATEGORIES)).toBe("RESET LOCAL DATA");
  });

  it("separates retained-backup deletion from ordinary selected data", () => {
    expect(requiredLocalDataConfirmation(["backups"])).toBe("DELETE BACKUPS");
    expect(requiredLocalDataConfirmation(["study-metadata"])).toBe("DELETE SELECTED DATA");
  });

  it("offers safety backups only when retained backups are preserved", () => {
    expect(canCreateSafetyBackup(["settings", "study-metadata"])).toBe(true);
    expect(canCreateSafetyBackup(["activity"])).toBe(false);
    expect(canCreateSafetyBackup(["settings", "backups"])).toBe(false);
  });

  it("totals the selected record groups", () => {
    expect(selectedLocalDataCount(snapshot, ["user-vocabulary", "activity"])).toBe(12);
  });
});
