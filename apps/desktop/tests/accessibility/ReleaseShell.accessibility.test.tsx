import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppContent } from "../../src/app/layout/AppContent";
import { RouteLoadingFallback } from "../../src/app/performance";

describe("release shell accessibility", () => {
  it("provides a programmatically focusable main landmark", () => {
    const markup = renderToStaticMarkup(
      <AppContent>
        <h1>Vocabulary</h1>
      </AppContent>
    );

    expect(markup).toContain("<main");
    expect(markup).toContain('aria-label="Application content"');
    expect(markup).toContain('id="main-content"');
    expect(markup).toContain('tabindex="-1"');
  });

  it("announces lazy-route loading without exposing decorative skeleton lines", () => {
    const markup = renderToStaticMarkup(<RouteLoadingFallback routeLabel="Library" />);

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("Loading Library");
    expect(markup).toContain('aria-hidden="true"');
  });
});
