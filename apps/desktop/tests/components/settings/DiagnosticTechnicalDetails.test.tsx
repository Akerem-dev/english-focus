import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DiagnosticReport } from "@platform/domain";

import { DiagnosticTechnicalDetails } from "../../../src/modules/settings/components/DiagnosticTechnicalDetails";

function renderDetails(report: DiagnosticReport): string {
  return renderToStaticMarkup(
    <DiagnosticTechnicalDetails copyStatus="idle" onCopy={() => undefined} report={report} />
  );
}

const report: DiagnosticReport = {
  generatedAt: "2026-07-21T12:00:00.000Z",
  appVersion: "1.0.0",
  databaseSchemaVersion: "3",
  overallStatus: "critical",
  checks: [
    {
      id: "backup-availability",
      title: "Recovery readiness",
      status: "failed",
      summary: "Saved backups could not be checked right now.",
      details: ["The backup folder was unavailable during this check."],
      repairable: false
    },
    {
      id: "diagnostic-coverage",
      title: "Diagnostic coverage",
      status: "failed",
      summary: "One or more local data checks could not be completed.",
      details: [
        "Saved words could not be checked completely.",
        "Saved backups could not be checked completely."
      ],
      repairable: false
    }
  ],
  counts: {
    vocabularyEntries: 0,
    vocabularyMetadata: 0,
    settingsRecords: 0,
    retainedBackups: 0,
    invalidVocabularyJson: 0,
    invalidMetadataJson: 0,
    invalidSettingsJson: 0,
    normalizedWordMismatches: 0
  },
  recommendations: ["Check app health again."]
};

describe("DiagnosticTechnicalDetails", () => {
  it("does not present unavailable diagnostic measurements as real zero counts", () => {
    const markup = renderDetails(report);

    expect(markup).toContain("Check completeness");
    expect(markup.match(/Could not be checked/g)).toHaveLength(3);
    expect(markup).not.toContain("<dt>Saved words</dt><dd>0</dd>");
    expect(markup).not.toContain("<dt>Saved backups</dt><dd>0</dd>");
  });
});
