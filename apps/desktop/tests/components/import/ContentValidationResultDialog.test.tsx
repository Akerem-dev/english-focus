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
  code: "generator_warning",
  path: ["generation", "warnings", 0],
  pathText: "generation.warnings[0]",
  message: "Generator warning: Content is unvalidated and should be reviewed before trusted use."
};

const callbacks = {
  onClose: () => undefined,
  onEditJson: () => undefined,
  onOpenCorrectionInstruction: () => undefined,
  onPreview: () => undefined
} as const;

describe("ContentValidationResultDialog", () => {
  it("renders blocking content issues in plain language", () => {
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

    expect(markup).toContain("Some content needs attention");
    expect(markup).toContain("Items to fix");
    expect(markup).toContain("Expected allocate, but the entry represents maintain.");
    expect(markup).toContain("Copy correction request");
    expect(markup).toContain("Edit entry data");
    expect(markup).not.toContain("target_word_mismatch");
    expect(markup).not.toContain("normalizedWord");
  });

  it("shows a human review note without exposing generator metadata", () => {
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

    expect(markup).toContain("Entry is ready to review");
    expect(markup).toContain("Everything looks consistent");
    expect(markup).toContain("1 review note");
    expect(markup).toContain("This entry has not been reviewed yet");
    expect(markup).toContain("Review entry");
    expect(markup).not.toContain("generation.warnings[0]");
    expect(markup).not.toContain("generator_warning");
    expect(markup).not.toContain("Generator warning");
    expect(markup).not.toContain("Copy improvement instruction");
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

    expect(markup).toContain("Entry is ready to review");
    expect(markup).toContain("No review notes");
    expect(markup).toContain("Review entry");
    expect(markup).not.toContain("Copy correction request");
  });
});
