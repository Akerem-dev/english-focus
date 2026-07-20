import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../../src/app/providers";
import { LibraryPage } from "../../../src/modules/library/pages";

describe("LibraryPage", () => {
  it("renders the simplified effective library with direct detail navigation", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <AppProviders>
          <LibraryPage />
        </AppProviders>
      </MemoryRouter>
    );

    expect(markup).toContain('class="library-entry-count"');
    expect(markup).toContain("<strong>1</strong><span>entry</span>");
    expect(markup).toContain("Browse library by first letter");
    expect(markup).toContain("Show words starting with M");
    expect(markup).toContain('class="library-table__level-heading"');
    expect(markup).toContain('class="library-table__level"');
    expect(markup).toContain('data-level="B2"');
    expect(markup).toContain('aria-label="Open maintain details"');
    expect(markup).toContain('class="library-selection__control"');
    expect(markup).not.toContain(
      "Search, organize, review, and export vocabulary entries stored on this device."
    );
    expect(markup).not.toContain("Filter by layer");
    expect(markup).not.toContain("Learning status");
    expect(markup).not.toContain("Grammar patterns");
    expect(markup).not.toContain("Collocations");
    expect(markup).not.toContain("Preview");
  });
});
