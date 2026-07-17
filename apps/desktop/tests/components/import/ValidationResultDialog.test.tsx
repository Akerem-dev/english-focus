import type { ImportIssue } from "@platform/domain";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { maintainVocabularyEntry } from "../../../src/content/core";
import { ValidationResultDialog } from "../../../src/modules/import-export";

const issue: ImportIssue = {
  source: "schema",
  severity: "error",
  code: "invalid_type",
  path: ["grammar", "patterns", 2, "explanationTr"],
  pathText: "grammar.patterns[2].explanationTr",
  message: "Invalid input: expected string, received undefined"
};

const sharedCallbacks = {
  onClose: () => undefined,
  onEditJson: () => undefined,
  onOpenCorrectionInstruction: () => undefined,
  onRunContentChecks: () => undefined
} as const;

describe("ValidationResultDialog", () => {
  it("renders detailed schema issues and the correction action", () => {
    const markup = renderToStaticMarkup(
      <ValidationResultDialog
        {...sharedCallbacks}
        expectedWord="allocate"
        open
        result={{ kind: "failure", issues: [issue] }}
      />
    );

    expect(markup).toContain("Schema validation found issues");
    expect(markup).toContain("grammar.patterns[2].explanationTr");
    expect(markup).toContain("Invalid input: expected string");
    expect(markup).toContain("Copy correction instruction");
    expect(markup).toContain("Edit JSON");
  });

  it("offers the semantic and quality gate after structural validation", () => {
    const markup = renderToStaticMarkup(
      <ValidationResultDialog
        {...sharedCallbacks}
        expectedWord="maintain"
        open
        result={{ kind: "success", entry: maintainVocabularyEntry, issues: [] }}
      />
    );

    expect(markup).toContain("Schema validation passed");
    expect(markup).toContain("Vocabulary structure is valid");
    expect(markup).toContain("three primary examples");
    expect(markup).toContain("Next gate: content checks");
    expect(markup).toContain("Run content checks");
    expect(markup).not.toContain("Copy correction instruction");
    expect(markup).not.toContain("exactly ten");
  });

  it("renders nothing while closed", () => {
    const markup = renderToStaticMarkup(
      <ValidationResultDialog
        {...sharedCallbacks}
        expectedWord="allocate"
        open={false}
        result={{ kind: "failure", issues: [issue] }}
      />
    );

    expect(markup).toBe("");
  });
});
