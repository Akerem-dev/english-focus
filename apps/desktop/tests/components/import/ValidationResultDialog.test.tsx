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
  pathText: "meanings[2].usageNoteTr",
  message: "Invalid input: expected string, received undefined"
};

const sharedCallbacks = {
  onClose: () => undefined,
  onEditJson: () => undefined,
  onOpenCorrectionInstruction: () => undefined,
  onRunContentChecks: () => undefined
} as const;

describe("ValidationResultDialog", () => {
  it("renders required-field issues without exposing schema paths", () => {
    const markup = renderToStaticMarkup(
      <ValidationResultDialog
        {...sharedCallbacks}
        expectedWord="allocate"
        open
        result={{ kind: "failure", issues: [issue] }}
      />
    );

    expect(markup).toContain("Some required information needs attention");
    expect(markup).toContain("Items to fix");
    expect(markup).toContain("Invalid input: expected string");
    expect(markup).toContain("Copy correction request");
    expect(markup).toContain("Edit entry data");
    expect(markup).not.toContain("meanings[2].usageNoteTr");
    expect(markup).not.toContain("invalid_type");
    expect(markup).not.toContain("Schema validation");
  });

  it("offers a plain-language content review after required fields pass", () => {
    const markup = renderToStaticMarkup(
      <ValidationResultDialog
        {...sharedCallbacks}
        expectedWord="maintain"
        open
        result={{ kind: "success", entry: maintainVocabularyEntry, issues: [] }}
      />
    );

    expect(markup).toContain("Required information is complete");
    expect(markup).toContain("The entry is complete");
    expect(markup).toContain("three examples");
    expect(markup).toContain("Continue review");
    expect(markup).not.toContain("Schema 1.0.0");
    expect(markup).not.toContain("semantic");
    expect(markup).not.toContain("Zod");
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
