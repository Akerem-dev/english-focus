import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../../src/app/providers";
import { LibraryPage } from "../../../src/modules/library/pages";

describe("LibraryPage", () => {
  it("renders the effective core library instead of a fake empty collection", () => {
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
    expect(markup).toContain(">B2</span>");
    expect(markup).not.toContain("Core entry");
    expect(markup).not.toContain("Local SQLite library");
    expect(markup).not.toContain("Reviewed import");
    expect(markup).not.toContain("after search, filters, and sorting");
    expect(markup).not.toContain("Your Library is empty");
  });
});
