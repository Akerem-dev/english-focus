import type { ImportIssue } from "@platform/domain";
import { createValidVocabularyEntry } from "@platform/testing";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  VocabularyPreviewDialog,
  previewVocabularyImport
} from "../../../src/modules/import-export";

const warning: ImportIssue = {
  source: "quality",
  severity: "warning",
  code: "limited_collocations",
  path: ["collocations"],
  pathText: "collocations",
  message: "Only a small number of collocations is included."
};

const entry = createValidVocabularyEntry({
  source: {
    kind: "user",
    sourceId: "cp12-dialog-test",
    sourceLabel: "CP12 dialog fixture"
  },
  generation: {
    method: "external-ai",
    generatedAt: "2026-01-01T00:00:00.000Z",
    validationStatus: "unvalidated",
    generatorLabel: "Manual CP12 fixture",
    warnings: []
  }
});

const preview = previewVocabularyImport(entry, "maintain", [warning]);

const callbacks = {
  onApprove: () => undefined,
  onBack: () => undefined,
  onClose: () => undefined,
  onContinue: () => undefined,
  onEditJson: () => undefined
} as const;

describe("VocabularyPreviewDialog", () => {
  it("renders the complete entry review and requires an explicit acknowledgement", () => {
    const markup = renderToStaticMarkup(
      <VocabularyPreviewDialog {...callbacks} approvalState="pending" open preview={preview} />
    );

    expect(markup).toContain("Review vocabulary entry");
    expect(markup).toContain("Expected word: maintain");
    expect(markup).toContain("maintain");
    expect(markup).toContain("sürdürmek, korumak");
    expect(markup).toContain("10");
    expect(markup).toContain("Import readiness");
    expect(markup).toContain("I reviewed this vocabulary entry.");
    expect(markup).toContain("Approve preview");
    expect(markup).toContain("disabled");
    expect(markup).toContain("1 advisory warnings");
  });

  it("shows an in-memory approval without pretending the entry was saved", () => {
    const markup = renderToStaticMarkup(
      <VocabularyPreviewDialog {...callbacks} approvalState="approved" open preview={preview} />
    );

    expect(markup).toContain("Preview approved");
    expect(markup).toContain("Nothing has been saved yet");
    expect(markup).toContain("Continue to duplicate check");
    expect(markup).not.toContain("Duplicate handling arrives in CP13");
  });

  it("renders nothing while closed", () => {
    expect(
      renderToStaticMarkup(
        <VocabularyPreviewDialog
          {...callbacks}
          approvalState="pending"
          open={false}
          preview={preview}
        />
      )
    ).toBe("");
  });
});
