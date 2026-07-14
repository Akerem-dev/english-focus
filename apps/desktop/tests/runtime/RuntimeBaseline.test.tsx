import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RuntimeBaseline } from "../../src/app/runtime";

describe("RuntimeBaseline", () => {
  it("renders the CP04B accessible-component checkpoint screen", () => {
    const markup = renderToStaticMarkup(<RuntimeBaseline />);

    expect(markup).toContain("Accessible component foundation ready");
    expect(markup).toContain("Checkpoint CP04B");
    expect(markup).toContain("Actions");
    expect(markup).toContain("Form controls");
    expect(markup).toContain("Accessibility contract");
    expect(markup).toContain("CEFR B2");
    expect(markup).toContain("Checking runtime");
  });
});
