import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { VocabularyRepositoryProvider } from "../../../src/app/providers";
import { PasteGeneratedJsonDialog } from "../../../src/modules/import-export";

describe("PasteGeneratedJsonDialog", () => {
  it("renders the local syntax and schema-validation workflow for the expected word", () => {
    const markup = renderToStaticMarkup(
      <VocabularyRepositoryProvider>
        <PasteGeneratedJsonDialog expectedWord="allocate" onClose={() => undefined} open />
      </VocabularyRepositoryProvider>
    );

    expect(markup).toContain("Paste generated JSON");
    expect(markup).toContain("Expected word: allocate");
    expect(markup).toContain("Generated vocabulary JSON");
    expect(markup).toContain("Check JSON syntax");
    expect(markup).toContain("Syntax check first");
    expect(markup).toContain("versioned Zod vocabulary contract");
    expect(markup).toContain("Nothing is uploaded");
  });

  it("renders nothing while closed", () => {
    expect(
      renderToStaticMarkup(
        <VocabularyRepositoryProvider>
          <PasteGeneratedJsonDialog
            expectedWord="allocate"
            onClose={() => undefined}
            open={false}
          />
        </VocabularyRepositoryProvider>
      )
    ).toBe("");
  });
});
