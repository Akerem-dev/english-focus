import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PasteGeneratedJsonDialog } from "../../../src/modules/import-export";

describe("PasteGeneratedJsonDialog", () => {
  it("renders the local syntax-check workflow for the expected word", () => {
    const markup = renderToStaticMarkup(
      <PasteGeneratedJsonDialog expectedWord="allocate" onClose={() => undefined} open />
    );

    expect(markup).toContain("Paste generated JSON");
    expect(markup).toContain("Expected word: allocate");
    expect(markup).toContain("Generated vocabulary JSON");
    expect(markup).toContain("Check JSON syntax");
    expect(markup).toContain("Schema check next");
    expect(markup).toContain("Nothing is uploaded");
  });

  it("renders nothing while closed", () => {
    expect(
      renderToStaticMarkup(
        <PasteGeneratedJsonDialog expectedWord="allocate" onClose={() => undefined} open={false} />
      )
    ).toBe("");
  });
});
