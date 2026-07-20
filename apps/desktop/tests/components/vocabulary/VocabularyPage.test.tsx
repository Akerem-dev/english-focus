import { createValidVocabularyEntry } from "@platform/testing";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import {
  ActivityProvider,
  VocabularyMetadataProvider,
  VocabularyRepositoryProvider
} from "../../../src/app/providers";
import {
  VocabularyInvalidSearchState,
  VocabularyNotFoundState,
  VocabularySearchResultsState,
  VocabularySearchingState
} from "../../../src/modules/vocabulary/components";
import { VocabularyPage } from "../../../src/modules/vocabulary/pages";

describe("VocabularyPage search states", () => {
  it("renders the initial local-search experience", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <ActivityProvider>
          <VocabularyRepositoryProvider>
            <VocabularyMetadataProvider>
              <VocabularyPage />
            </VocabularyMetadataProvider>
          </VocabularyRepositoryProvider>
        </ActivityProvider>
      </MemoryRouter>
    );

    expect(markup).toContain("Search your local vocabulary");
    expect(markup).toContain("Prefix and full-text matching");
    expect(markup).toContain("Recent searches");
  });

  it("renders the searching state", () => {
    const markup = renderToStaticMarkup(<VocabularySearchingState query="maintain" />);

    expect(markup).toContain("Looking for “maintain”");
    expect(markup).toContain("translations, definitions, tags, and notes");
  });

  it("renders ranked prefix and full-text matches", () => {
    const entry = createValidVocabularyEntry();
    const markup = renderToStaticMarkup(
      <VocabularySearchResultsState
        matches={[
          {
            entry,
            matchKind: "full-text",
            matchedField: "translation",
            matchedText: "sürdürmek"
          }
        ]}
        onSelectMatch={() => undefined}
        query="surdur"
      />
    );

    expect(markup).toContain("1 match for “surdur”");
    expect(markup).toContain("maintain");
    expect(markup).toContain("Turkish translation · full text");
    expect(markup).toContain("sürdürmek");
  });

  it("renders the invalid state with guidance", () => {
    const markup = renderToStaticMarkup(
      <VocabularyInvalidSearchState
        message="Use letters, numbers, spaces, apostrophes, or hyphens only."
        onEditSearch={() => undefined}
      />
    );

    expect(markup).toContain("Refine your search");
    expect(markup).toContain("Use letters, numbers, spaces");
  });

  it("renders the not-found state and suggestions", () => {
    const markup = renderToStaticMarkup(
      <VocabularyNotFoundState
        canCreateEntry
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

  it("keeps entry-creation actions out of translation and phrase misses", () => {
    const markup = renderToStaticMarkup(
      <VocabularyNotFoundState
        canCreateEntry={false}
        normalizedQuery="eksik ifade"
        onEditSearch={() => undefined}
        onOpenInstruction={() => undefined}
        onOpenPasteGeneratedJson={() => undefined}
        onSelectSuggestion={() => undefined}
        suggestions={[]}
      />
    );

    expect(markup).toContain("No local match");
    expect(markup).not.toContain("Copy AI instruction");
    expect(markup).not.toContain("Paste generated JSON");
  });
});
