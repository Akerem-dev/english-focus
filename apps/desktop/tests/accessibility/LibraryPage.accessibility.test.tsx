import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../src/app/providers";
import { LibraryPage } from "../../src/modules/library/pages";

describe("LibraryPage accessibility", () => {
  it("provides named search, filter, export, selection, and detail controls", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <AppProviders>
          <LibraryPage />
        </AppProviders>
      </MemoryRouter>
    );

    expect(markup).toContain("Search library");
    expect(markup).toContain('aria-label="Library filters"');
    expect(markup).toContain("Export selected");
    expect(markup).toContain('aria-label="Select maintain"');
    expect(markup).toContain('aria-label="Open maintain details"');
    expect(markup).toContain('role="row"');
  });
});
