import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppIcon, EnglishFocusMark } from "../../src/design-system";

describe("AppIcon", () => {
  it("renders decorative SVG icons with currentColor", () => {
    const markup = renderToStaticMarkup(<AppIcon name="search" />);

    expect(markup).toContain("<svg");
    expect(markup).toContain('stroke="currentColor"');
    expect(markup).toContain('aria-hidden="true"');
  });

  it("renders an accessible label when supplied", () => {
    const markup = renderToStaticMarkup(<AppIcon name="settings" label="Settings" />);

    expect(markup).toContain('role="img"');
    expect(markup).toContain('aria-label="Settings"');
  });

  it("renders the vector EF brand mark", () => {
    const markup = renderToStaticMarkup(<EnglishFocusMark />);

    expect(markup).toContain("English Focus");
    expect(markup).toContain(">EF<");
  });
});
