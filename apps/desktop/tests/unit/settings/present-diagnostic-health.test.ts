import type { DiagnosticReport } from "@platform/domain";
import { describe, expect, it } from "vitest";

import { presentDiagnosticHealth } from "../../../src/modules/settings/application";

const BASE_COUNTS: DiagnosticReport["counts"] = {
  vocabularyEntries: 2,
  vocabularyMetadata: 1,
  settingsRecords: 1,
  retainedBackups: 1,
  invalidVocabularyJson: 0,
  invalidMetadataJson: 0,
  invalidSettingsJson: 0,
  normalizedWordMismatches: 0
};

function createReport(overrides: Partial<DiagnosticReport> = {}): DiagnosticReport {
  return {
    generatedAt: "2026-07-18T19:00:00.000Z",
    appVersion: "1.0.0",
    databaseSchemaVersion: "1",
    overallStatus: "healthy",
    checks: [
      {
        id: "sqlite-integrity",
        title: "SQLite integrity",
        status: "passed",
        summary: "ok",
        details: [],
        repairable: false
      },
      {
        id: "backup-availability",
        title: "Backup availability",
        status: "passed",
        summary: "ok",
        details: [],
        repairable: false
      }
    ],
    counts: BASE_COUNTS,
    recommendations: ["No action is needed."],
    ...overrides
  };
}

describe("presentDiagnosticHealth", () => {
  it("summarizes healthy data and an available backup", () => {
    const presentation = presentDiagnosticHealth(createReport());

    expect(presentation.status).toBe("healthy");
    expect(presentation.backupState).toBe("available");
    expect(presentation.title).toBe("Everything looks good");
    expect(presentation.facts).toEqual([
      { id: "data", label: "Your data", value: "Working normally", tone: "good" },
      { id: "backups", label: "Backups", value: "Ready", tone: "good" },
      {
        id: "next-step",
        label: "Next step",
        value: "Nothing to do",
        tone: "good"
      }
    ]);
  });

  it("treats a missing first backup as a neutral recommendation", () => {
    const presentation = presentDiagnosticHealth(
      createReport({
        overallStatus: "attention",
        checks: [
          {
            id: "sqlite-integrity",
            title: "SQLite integrity",
            status: "passed",
            summary: "ok",
            details: [],
            repairable: false
          },
          {
            id: "backup-availability",
            title: "Backup availability",
            status: "warning",
            summary: "none",
            details: [],
            repairable: false
          }
        ],
        counts: { ...BASE_COUNTS, retainedBackups: 0 }
      })
    );

    expect(presentation.status).toBe("healthy");
    expect(presentation.backupState).toBe("missing");
    expect(presentation.title).toBe("Your app data looks good");
    expect(presentation.facts[1]).toEqual({
      id: "backups",
      label: "Backups",
      value: "Not created yet",
      tone: "neutral"
    });
    expect(presentation.facts[2]).toEqual({
      id: "next-step",
      label: "Next step",
      value: "Create your first backup",
      tone: "neutral"
    });
  });

  it("surfaces a safe fix without exposing database terminology", () => {
    const presentation = presentDiagnosticHealth(
      createReport({
        overallStatus: "attention",
        checks: [
          {
            id: "database-pragmas",
            title: "Database safety settings",
            status: "warning",
            summary: "needs repair",
            details: [],
            repairable: true
          },
          {
            id: "backup-availability",
            title: "Backup availability",
            status: "passed",
            summary: "ok",
            details: [],
            repairable: false
          }
        ]
      })
    );

    expect(presentation.status).toBe("attention");
    expect(presentation.title).toBe("A quick check is recommended");
    expect(presentation.repairableIssueCount).toBe(1);
    expect(presentation.facts[2]).toEqual({
      id: "next-step",
      label: "Next step",
      value: "Safe fix available",
      tone: "check"
    });
  });

  it("does not recommend restoring a backup when none exists", () => {
    const presentation = presentDiagnosticHealth(
      createReport({
        overallStatus: "critical",
        checks: [
          {
            id: "data-consistency",
            title: "Stored data consistency",
            status: "failed",
            summary: "invalid data",
            details: [],
            repairable: false
          },
          {
            id: "backup-availability",
            title: "Backup availability",
            status: "warning",
            summary: "none",
            details: [],
            repairable: false
          }
        ],
        counts: { ...BASE_COUNTS, retainedBackups: 0 }
      })
    );

    expect(presentation.status).toBe("critical");
    expect(presentation.backupState).toBe("missing");
    expect(presentation.nonRepairableFailureCount).toBe(1);
    expect(presentation.facts.find((fact) => fact.id === "next-step")?.value).toBe(
      "Review details before changes"
    );
  });
});
