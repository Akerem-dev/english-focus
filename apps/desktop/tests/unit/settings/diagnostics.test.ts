import { describe, expect, it } from "vitest";
import type { DiagnosticReport } from "@platform/domain";

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
