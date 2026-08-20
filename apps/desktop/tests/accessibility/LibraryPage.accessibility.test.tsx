import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../src/app/providers";
import { LibraryPage } from "../../src/modules/library/pages";

describe("LibraryPage accessibility", () => {
  it("keeps the collections overview controls discoverable in markup", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <AppProviders>
          <LibraryPage />
        </AppProviders>
      </MemoryRouter>
    );

    expect(markup).toContain("Your Collections");
    expect(markup).toContain("New collection");
    expect(markup).toContain('placeholder="Search collections…"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain("Gathering your collections…");
    expect(markup).toContain('class="wvc-search"');
    expect(markup).not.toContain('role="row"');
  });
});
