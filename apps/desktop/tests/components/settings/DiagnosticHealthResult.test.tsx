import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { DiagnosticHealthPresentation } from "../../../src/modules/settings/application";
import { DiagnosticHealthResult } from "../../../src/modules/settings/components/DiagnosticHealthResult";

function renderResult(presentation: DiagnosticHealthPresentation): string {
  return renderToStaticMarkup(
    <DiagnosticHealthResult onRepair={() => undefined} presentation={presentation} repairing={false} />
  );
}

describe("DiagnosticHealthResult", () => {
  it("presents a missing first backup as optional guidance when app data is healthy", () => {
    const markup = renderResult({
      status: "healthy",
      backupState: "missing",
      title: "Your app data looks good",
      description: "Your words and settings are working normally.",
      facts: [
        { id: "data", label: "Your data", value: "Working normally", tone: "good" },
        { id: "backups", label: "Backups", value: "Not created yet", tone: "neutral" },
        {
          id: "next-step",
          label: "Next step",
          value: "Create your first backup",
          tone: "neutral"
        }
      ],
      repairableIssueCount: 0,
      nonRepairableFailureCount: 0
    });

    expect(markup).toContain('data-status="healthy"');
    expect(markup).toContain("Create your first backup");
    expect(markup).toContain("A backup is optional");
    expect(markup).not.toContain("Apply safe fix");
    expect(markup).not.toContain("Use a checked backup");
  });

  it("does not recommend restoring a backup when a serious issue has no backup available", () => {
    const markup = renderResult({
      status: "critical",
      backupState: "missing",
      title: "Your data needs attention",
      description: "Some saved information could not be verified.",
      facts: [
        { id: "data", label: "Your data", value: "Problem found", tone: "problem" },
        { id: "backups", label: "Backups", value: "Not created yet", tone: "neutral" },
        {
          id: "next-step",
          label: "Next step",
          value: "Review details before changes",
          tone: "problem"
        }
      ],
      repairableIssueCount: 0,
      nonRepairableFailureCount: 1
    });

    expect(markup).toContain('data-status="critical"');
    expect(markup).toContain("Review the details before changing data");
    expect(markup).toContain("No checked backup is available");
    expect(markup).not.toContain("Use a checked backup");
    expect(markup).not.toContain("restore the newest backup");
  });
});
