import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  activityRecordNativeCompatibilitySchema,
  activityRecordSchema,
  backupDescriptorSchema,
  backupRestoreResultSchema,
  backupValidationResultNativeCompatibilitySchema,
  backupValidationResultSchema,
  diagnosticReportSchema,
  diagnosticScanCoverageSchema,
  localDataSnapshotSchema,
  resetLocalDataResultNativeCompatibilitySchema,
  resetLocalDataResultSchema,
  safeMaintenanceResultSchema,
  unavailableBackupSchema
} from "../src";

interface NativeBoundaryFixtures {
  readonly activityRecord: unknown;
  readonly backupDescriptor: unknown;
  readonly backupValidationResult: unknown;
  readonly backupValidationWithoutDescriptor: unknown;
  readonly backupRestoreResult: unknown;
  readonly unavailableBackup: unknown;
  readonly diagnosticReport: unknown;
  readonly safeMaintenanceResult: unknown;
  readonly diagnosticScanCoverage: unknown;
  readonly localDataSnapshot: unknown;
  readonly resetLocalDataResult: unknown;
}

function loadFixtures(): NativeBoundaryFixtures {
  const path = new URL("../../../testing/contracts/native-boundary-fixtures.json", import.meta.url);
  return JSON.parse(readFileSync(path, "utf8")) as NativeBoundaryFixtures;
}

describe("native boundary contracts", () => {
  const fixtures = loadFixtures();

  it("accepts every representative desktop response", () => {
    expect(() =>
      activityRecordNativeCompatibilitySchema.parse(fixtures.activityRecord)
    ).not.toThrow();
    expect(() => backupDescriptorSchema.parse(fixtures.backupDescriptor)).not.toThrow();
    expect(() =>
      backupValidationResultNativeCompatibilitySchema.parse(fixtures.backupValidationResult)
    ).not.toThrow();
    expect(() =>
      backupValidationResultNativeCompatibilitySchema.parse(
        fixtures.backupValidationWithoutDescriptor
      )
    ).not.toThrow();
    expect(() => backupRestoreResultSchema.parse(fixtures.backupRestoreResult)).not.toThrow();
    expect(() => unavailableBackupSchema.parse(fixtures.unavailableBackup)).not.toThrow();
    expect(() => diagnosticReportSchema.parse(fixtures.diagnosticReport)).not.toThrow();
    expect(() => safeMaintenanceResultSchema.parse(fixtures.safeMaintenanceResult)).not.toThrow();
    expect(() => diagnosticScanCoverageSchema.parse(fixtures.diagnosticScanCoverage)).not.toThrow();
    expect(() => localDataSnapshotSchema.parse(fixtures.localDataSnapshot)).not.toThrow();
    expect(() =>
      resetLocalDataResultNativeCompatibilitySchema.parse(fixtures.resetLocalDataResult)
    ).not.toThrow();
  });

  it("normalizes nullable desktop option fields only in application schemas", () => {
    expect(activityRecordSchema.parse(fixtures.activityRecord)).toEqual(
      expect.objectContaining({ target: undefined })
    );
    expect(backupValidationResultSchema.parse(fixtures.backupValidationWithoutDescriptor)).toEqual(
      expect.objectContaining({ descriptor: undefined })
    );
    expect(resetLocalDataResultSchema.parse(fixtures.resetLocalDataResult)).toEqual(
      expect.objectContaining({ safetyBackup: undefined })
    );
  });

  it("rejects data that was not declared by the bridge contract", () => {
    expect(() =>
      activityRecordNativeCompatibilitySchema.parse({
        ...(fixtures.activityRecord as Record<string, unknown>),
        privateNote: "must remain local"
      })
    ).toThrow();
  });
});
