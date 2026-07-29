import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppSidebar } from "../../../src/app/layout/AppSidebar";

describe("AppSidebar", () => {
  it("exposes the full brand as a wordbook-home link", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/library"]}>
        <AppSidebar />
      </MemoryRouter>
    );

    expect(markup).toContain('aria-label="Word Valley wordbook home"');
    expect(markup).toContain('class="app-sidebar__brand"');
    expect(markup).toContain('href="/"');
    expect(markup).toContain("Word");
    expect(markup).toContain("Valley");
    expect(markup).toContain("app-sidebar__brand-mascot");
  });
});
