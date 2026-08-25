import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../../src/app/providers";
import { LibraryPage } from "../../../src/modules/library/pages";

describe("LibraryPage", () => {
  it("renders the current collections overview without legacy library-table UI", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <AppProviders>
          <LibraryPage />
        </AppProviders>
      </MemoryRouter>
    );

    expect(markup).toContain("Your Collections");
    expect(markup).toContain("New collection");
    expect(markup).toContain("Search collections…");
    expect(markup).toContain("Gathering your collections…");
    expect(markup).toContain('class="wvc-page wvc-page--overview"');
    expect(markup).toContain('class="wvc-toolbar wvc-toolbar--overview"');
    expect(markup).not.toContain('class="library-entry-count"');
    expect(markup).not.toContain("Filter by layer");
    expect(markup).not.toContain("Learning status");
    expect(markup).not.toContain("Grammar patterns");
  });
});
