import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../src/app/providers";
import { VocabularyPage } from "../../src/modules/vocabulary/pages";

describe("VocabularyPage accessibility", () => {
  it("labels its search and empty recent-activity regions", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <AppProviders>
          <VocabularyPage />
        </AppProviders>
      </MemoryRouter>
    );

    expect(markup).toContain('role="search"');
    expect(markup).toContain('aria-label="Vocabulary search"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain("Words you open will appear here.");
  });
});
