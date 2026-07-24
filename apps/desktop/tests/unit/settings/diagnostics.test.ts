import { describe, expect, it } from "vitest";
import type { DiagnosticReport } from "@platform/domain";

import { applyDiagnosticScanCoverage } from "../../../src/infrastructure/persistence/TauriDiagnosticsRepository";
import { createDiagnosticSummary } from "../../../src/modules/settings/application";

const report: DiagnosticReport = Object.freeze({
  generatedAt: "2026-07-15T20:00:00.000Z",
  appVersion: "0.1.0",
  databaseSchemaVersion: "3",
  overallStatus: "attention",
  checks: Object.freeze([
    Object.freeze({
      id: "sqlite-integrity",
      title: "SQLite integrity",
      status: "passed",
      summary: "No structural problems.",
      details: Object.freeze([]),
      repairable: false
    }),
    Object.freeze({
      id: "backup-availability",
      title: "Recovery readiness",
      status: "warning",
      summary: "No retained backup exists.",
      details: Object.freeze(["Create a manual backup."]),
      repairable: false
    })
  ]),
  counts: Object.freeze({
    vocabularyEntries: 2,
    vocabularyMetadata: 1,
    settingsRecords: 1,
    retainedBackups: 0,
    invalidVocabularyJson: 0,
    invalidMetadataJson: 0,
    invalidSettingsJson: 0,
    normalizedWordMismatches: 0
  }),
  recommendations: Object.freeze(["Create a manual backup."])
});

describe("createDiagnosticSummary", () => {
  it("creates a plain-text, local-safe support summary", () => {
    const summary = createDiagnosticSummary(report);

    expect(summary).toContain("English Focus local diagnostics");
    expect(summary).toContain("Overall status: attention");
    expect(summary).toContain("Vocabulary entries: 2");
    expect(summary).toContain("[PASSED] SQLite integrity");
    expect(summary).toContain("[WARNING] Recovery readiness");
    expect(summary).toContain("Create a manual backup.");
  });
});

describe("applyDiagnosticScanCoverage", () => {
  it("marks an otherwise healthy report critical when a scan did not finish", () => {
    const healthyReport: DiagnosticReport = Object.freeze({
      ...report,
      overallStatus: "healthy",
      checks: Object.freeze([report.checks[0]!]),
      recommendations: Object.freeze(["No action is required. Local storage is healthy."])
    });

    const protectedReport = applyDiagnosticScanCoverage(healthyReport, {
      complete: false,
      issues: Object.freeze(["Recent activity could not be scanned completely: invalid value"])
    });

    expect(protectedReport.overallStatus).toBe("critical");
    expect(protectedReport.checks).toContainEqual(
      expect.objectContaining({
        id: "diagnostic-coverage",
        status: "failed",
        repairable: false,
        details: ["Recent activity could not be checked completely."]
      })
    );
    expect(protectedReport.recommendations).not.toContain(
      "No action is required. Local storage is healthy."
    );
    expect(protectedReport.recommendations.at(-1)).toContain("check app health again");
    expect(JSON.stringify(protectedReport)).not.toContain("invalid value");
  });

  it("marks backup availability unavailable when the backup scan did not finish", () => {
    const protectedReport = applyDiagnosticScanCoverage(report, {
      complete: false,
      issues: Object.freeze(["Saved backups could not be scanned completely: permission denied"])
    });
    const backupCheck = protectedReport.checks.find((check) => check.id === "backup-availability");

    expect(backupCheck).toEqual(
      expect.objectContaining({
        status: "failed",
        summary: "Saved backups could not be checked right now.",
        details: ["The backup folder was unavailable during this check."]
      })
    );
    expect(JSON.stringify(protectedReport)).not.toContain("permission denied");
  });

  it("deduplicates friendly coverage messages", () => {
    const protectedReport = applyDiagnosticScanCoverage(report, {
      complete: false,
      issues: Object.freeze([
        "Vocabulary records could not be scanned completely: row 1",
        "Vocabulary records could not be scanned completely: row 2"
      ])
    });
    const coverageCheck = protectedReport.checks.find(
      (check) => check.id === "diagnostic-coverage"
    );

    expect(coverageCheck?.details).toEqual(["Saved words could not be checked completely."]);
  });

  it("leaves a fully covered diagnostic report unchanged", () => {
    expect(
      applyDiagnosticScanCoverage(report, {
        complete: true,
        issues: Object.freeze([])
      })
    ).toBe(report);
  });
});
