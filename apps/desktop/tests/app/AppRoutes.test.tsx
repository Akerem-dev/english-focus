import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppLayout } from "../../src/app/layout";
import { AppRouter, APP_ROUTES, ROUTE_PATHS } from "../../src/app/router";

function renderRoute(path: string) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <AppLayout>
        <AppRouter />
      </AppLayout>
    </MemoryRouter>
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

  it("renders the vocabulary route inside the persistent shell", () => {
    const markup = renderRoute(ROUTE_PATHS.vocabulary);

    expect(markup).toContain("Look up an English word");
    expect(markup).toContain("Primary navigation");
    expect(markup).toContain("Local Library");
  });

  it("renders the library route", () => {
    const markup = renderRoute(ROUTE_PATHS.library);

    expect(markup).toContain("Your library is empty");
    expect(markup).toContain("0 entries");
  });

  it("renders the settings route", () => {
    const markup = renderRoute(ROUTE_PATHS.settings);

    expect(markup).toContain("Appearance &amp; accessibility");
    expect(markup).toContain("Automatic backups");
  });
});
