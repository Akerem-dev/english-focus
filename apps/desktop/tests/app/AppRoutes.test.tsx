import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppLayout } from "../../src/app/layout";
import { AppProviders } from "../../src/app/providers";
import { AppRouter, APP_ROUTES, ROUTE_PATHS } from "../../src/app/router";

function renderRoute(path: string) {
  return renderToStaticMarkup(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <AppLayout>
          <AppRouter />
        </AppLayout>
      </MemoryRouter>
    </AppProviders>
  );
}

describe("application routes", () => {
  it("defines exactly three primary routes", () => {
    expect(APP_ROUTES).toHaveLength(3);
    expect(APP_ROUTES.map((route) => route.path)).toEqual([
      ROUTE_PATHS.vocabulary,
      ROUTE_PATHS.library,
      ROUTE_PATHS.settings
    ]);
  });

  it("renders the wordbook route loading boundary inside the clean search shell", () => {
    const markup = renderRoute(ROUTE_PATHS.vocabulary);

    expect(markup).toContain("Loading Wordbook");
    expect(markup).toContain("Primary navigation");
    expect(markup).toContain("WORD VALLEY");
    expect(markup).toContain("YOUR PROGRESS");
    expect(markup).toContain("application-frame--search-cleanroom");
    expect(markup).toContain("wvclean-sidebar");
    expect(markup).toContain('aria-label="Notifications"');
    expect(markup).toContain('aria-label="Window controls"');
    expect(markup).toContain('aria-label="Toggle full screen"');
    expect(markup).toContain('href="#main-content"');
    expect(markup).not.toContain("word-valley-backdrop__static");
  });

  it("renders the library route loading boundary", () => {
    const markup = renderRoute(ROUTE_PATHS.library);

    expect(markup).toContain("Loading Library");
    expect(markup).toContain("Library page loaded");
    expect(markup).toContain('aria-label="Window controls"');
  });

  it("renders the settings route loading boundary", () => {
    const markup = renderRoute(ROUTE_PATHS.settings);

    expect(markup).toContain("Loading Settings");
    expect(markup).toContain("Settings page loaded");
    expect(markup).toContain('aria-label="Window controls"');
  });
});
