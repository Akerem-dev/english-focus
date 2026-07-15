import { describe, expect, it } from "vitest";

import { diagnosticReportSchema, safeMaintenanceResultSchema } from "../../src";

const report = {
  generatedAt: "2026-07-15T20:00:00.000Z",
  appVersion: "0.1.0",
  databaseSchemaVersion: "2",
  overallStatus: "healthy",
  checks: [
    {
      id: "sqlite-integrity",
      title: "SQLite integrity",
      status: "passed",
      summary: "No structural problems.",
      details: [],
      repairable: false
    }
  ],
  counts: {
    vocabularyEntries: 2,
    vocabularyMetadata: 1,
    settingsRecords: 1,
    retainedBackups: 2,
    invalidVocabularyJson: 0,
    invalidMetadataJson: 0,
    invalidSettingsJson: 0,
    normalizedWordMismatches: 0
  },
  recommendations: ["No action is required."]
};

describe("diagnostic schemas", () => {
  it("accepts a strict native diagnostic report", () => {
    expect(diagnosticReportSchema.parse(report).overallStatus).toBe("healthy");
  });

  it("accepts a safe-maintenance result with a nested report", () => {
    const parsed = safeMaintenanceResultSchema.parse({
      completedAt: "2026-07-15T20:01:00.000Z",
      actions: ["Ran SQLite query-planner optimization."],
      report
    });

    expect(parsed.actions).toHaveLength(1);
  });
});
