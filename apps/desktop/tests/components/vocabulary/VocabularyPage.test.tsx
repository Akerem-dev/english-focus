import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { VocabularyRepositoryProvider } from "../../../src/app/providers";
import {
  VocabularyInvalidSearchState,
  VocabularyNotFoundState,
  VocabularySearchingState
} from "../../../src/modules/vocabulary/components";
import { VocabularyPage } from "../../../src/modules/vocabulary/pages";

describe("VocabularyPage search states", () => {
  it("renders the initial local-search experience", () => {
    const markup = renderToStaticMarkup(
      <VocabularyRepositoryProvider>
        <VocabularyPage />
      </VocabularyRepositoryProvider>
    );

    expect(markup).toContain("Look up an English word");
    expect(markup).toContain("alias, and inflected-form lookup");
    expect(markup).toContain("Recent searches");
  });

  it("renders the searching state", () => {
    const markup = renderToStaticMarkup(<VocabularySearchingState query="maintain" />);

    expect(markup).toContain("Looking for “maintain”");
    expect(markup).toContain("Checking exact entries");
  });

  it("renders the invalid state with guidance", () => {
    const markup = renderToStaticMarkup(
      <VocabularyInvalidSearchState
        message="Search for a single English word."
        onEditSearch={() => undefined}
      />
    );

    expect(markup).toContain("Enter a single English word");
    expect(markup).toContain("Search for a single English word.");
  });

  it("renders the not-found state and suggestions", () => {
    const markup = renderToStaticMarkup(
      <VocabularyNotFoundState
        normalizedQuery="maintan"
        onEditSearch={() => undefined}
        onOpenInstruction={() => undefined}
        onOpenPasteGeneratedJson={() => undefined}
        onSelectSuggestion={() => undefined}
        suggestions={["maintain"]}
      />
    );

    expect(markup).toContain("“maintan” was not found");
    expect(markup).toContain("Did you mean");
    expect(markup).toContain("maintain");
    expect(markup).toContain("Copy AI instruction");
    expect(markup).toContain("Paste generated JSON");
    expect(markup).not.toContain('title="Available in the JSON ingestion checkpoint"');
  });
});
