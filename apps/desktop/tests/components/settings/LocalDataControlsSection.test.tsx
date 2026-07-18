import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../../src/app/providers";
import { LocalDataControlsSection } from "../../../src/modules/settings/components";

describe("LocalDataControlsSection", () => {
  it("renders selective and full-reset entry points without deleting bundled vocabulary", () => {
    const markup = renderToStaticMarkup(
      <AppProviders>
        <LocalDataControlsSection />
      </AppProviders>
    );

    expect(markup).toContain("My data");
    expect(markup).toContain("Choose what to remove");
    expect(markup).toContain("Reset the app");
    expect(markup).toContain("Built-in vocabulary");
    expect(markup).toContain("Saved backups stay");
  });
});
