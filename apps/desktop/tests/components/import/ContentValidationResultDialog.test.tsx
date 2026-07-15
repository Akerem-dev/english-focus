import type { ImportIssue } from "@platform/domain";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { maintainVocabularyEntry } from "../../../src/content/core";
import { ContentValidationResultDialog } from "../../../src/modules/import-export";

const blockingIssue: ImportIssue = {
  source: "semantic",
  severity: "error",
  code: "target_word_mismatch",
  path: ["normalizedWord"],
  pathText: "normalizedWord",
  message: "Expected allocate, but the entry represents maintain."
};

const warning: ImportIssue = {
  source: "quality",
  severity: "warning",
  code: "missing_etymology",
  path: ["etymology"],
  pathText: "etymology",
  message: "No reliable etymology is included."
};

const callbacks = {
  onClose: () => undefined,
  onEditJson: () => undefined,
  onOpenCorrectionInstruction: () => undefined,
  onPreview: () => undefined
} as const;

describe("ContentValidationResultDialog", () => {
  it("renders blocking semantic issues and a correction action", () => {
    const markup = renderToStaticMarkup(
      <ContentValidationResultDialog
        {...callbacks}
        expectedWord="allocate"
        open
        result={{
          entry: maintainVocabularyEntry,
          semanticPassed: false,
          blockingIssues: [blockingIssue],
          qualityWarnings: [warning],
          allIssues: [blockingIssue, warning],
          canContinue: false
        }}
      />
    );

    expect(markup).toContain("Content validation found issues");
    expect(markup).toContain("Blocking semantic issues");
    expect(markup).toContain("target_word_mismatch");
    expect(markup).toContain("Non-blocking quality warnings");
    expect(markup).toContain("Correction required");
    expect(markup).toContain("Copy correction instruction");
  });

  it("allows warnings without treating them as blockers", () => {
    const markup = renderToStaticMarkup(
      <ContentValidationResultDialog
        {...callbacks}
        expectedWord="maintain"
        open
        result={{
          entry: maintainVocabularyEntry,
          semanticPassed: true,
          blockingIssues: [],
          qualityWarnings: [warning],
          allIssues: [warning],
          canContinue: true
        }}
      />
    );

    expect(markup).toContain("Content checks passed with warnings");
    expect(markup).toContain("Semantic checks passed");
    expect(markup).toContain("1 quality warnings");
    expect(markup).toContain("Ready for preview");
    expect(markup).toContain("Copy improvement instruction");
    expect(markup).toContain("Preview next");
  });

  it("renders a clean content result", () => {
    const markup = renderToStaticMarkup(
      <ContentValidationResultDialog
        {...callbacks}
        expectedWord="maintain"
        open
        result={{
          entry: maintainVocabularyEntry,
          semanticPassed: true,
          blockingIssues: [],
          qualityWarnings: [],
          allIssues: [],
          canContinue: true
        }}
      />
    );

    expect(markup).toContain("Content checks passed");
    expect(markup).toContain("Quality review clean");
    expect(markup).not.toContain("Copy correction instruction");
  });
});
