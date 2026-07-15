import { renderToStaticMarkup } from "react-dom/server";
import { createValidVocabularyEntry } from "@platform/testing";
import { describe, expect, it } from "vitest";

import { createCoreVocabularyContentSource } from "../../../src/infrastructure/content";
import {
  compareDuplicateEntries,
  resolveDuplicateEntry
} from "../../../src/modules/import-export/application";
import { DuplicateComparisonDialog } from "../../../src/modules/import-export/overlays";

const callbacks = {
  onBack: () => undefined,
  onClose: () => undefined,
  onEditJson: () => undefined,
  onResolve: () => undefined,
  onContinueToSave: () => undefined
};

function createUserEntry(word = "maintain") {
  return createValidVocabularyEntry({
    id: `user.${word}.cp13-dialog`,
    word,
    normalizedWord: word,
    source: { kind: "user", sourceId: "cp13-dialog" },
    generation: {
      method: "external-ai",
      generatedAt: "2026-07-15T00:00:00.000Z",
      validationStatus: "unvalidated",
      warnings: []
    }
  });
}

describe("DuplicateComparisonDialog", () => {
  it("renders the new-entry state without claiming anything was saved", () => {
    const result = compareDuplicateEntries(
      createCoreVocabularyContentSource(),
      createUserEntry("allocate")
    );
    const markup = renderToStaticMarkup(
      <DuplicateComparisonDialog {...callbacks} open result={result} />
    );

    expect(markup).toContain("No duplicate found");
    expect(markup).toContain("Ready to save as a new entry");
    expect(markup).toContain("Nothing has been written yet");
    expect(markup).toContain("Continue to save");
  });

  it("renders side-by-side content and all explicit decision choices", () => {
    const result = compareDuplicateEntries(createCoreVocabularyContentSource(), createUserEntry());
    const markup = renderToStaticMarkup(
      <DuplicateComparisonDialog {...callbacks} open result={result} />
    );

    expect(markup).toContain("Duplicate found");
    expect(markup).toContain("Existing entry");
    expect(markup).toContain("Imported entry");
    expect(markup).toContain("Keep existing");
    expect(markup).toContain("Replace with imported");
    expect(markup).toContain("Merge compatible content");
    expect(markup).toContain("Confirm decision");
  });

  it("renders a recorded decision without enabling persistence", () => {
    const result = compareDuplicateEntries(createCoreVocabularyContentSource(), createUserEntry());
    if (result.kind !== "duplicate") {
      throw new Error("Expected duplicate result.");
    }
    const resolution = resolveDuplicateEntry(result.comparison, "keep-existing");
    const markup = renderToStaticMarkup(
      <DuplicateComparisonDialog {...callbacks} open resolution={resolution} result={result} />
    );

    expect(markup).toContain("Duplicate decision recorded");
    expect(markup).toContain("Preserved separately");
    expect(markup).toContain("No — continue to save confirmation");
    expect(markup).toContain("Finish import");
  });
});
