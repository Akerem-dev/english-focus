import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RuntimeBaseline } from "../../src/app/runtime";

describe("RuntimeBaseline", () => {
  it("renders the CP03 native-runtime checkpoint screen", () => {
    const markup = renderToStaticMarkup(<RuntimeBaseline />);

    expect(markup).toContain("Checking application runtime");
    expect(markup).toContain("Checkpoint CP03");
    expect(markup).toContain("React");
    expect(markup).toContain("TypeScript");
    expect(markup).toContain("Vite");
    expect(markup).toContain("Tauri");
  });
});
