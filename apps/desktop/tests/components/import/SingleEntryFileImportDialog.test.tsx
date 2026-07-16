import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SingleEntryFileImportDialog } from "../../../src/modules/import-export";

describe("SingleEntryFileImportDialog", () => {
  it("renders the local single-entry file boundary", () => {
    const markup = renderToStaticMarkup(
      <SingleEntryFileImportDialog onClose={() => undefined} onContinue={() => undefined} open />
    );

    expect(markup).toContain("Import one vocabulary entry");
    expect(markup).toContain("Choose a vocabulary JSON file");
    expect(markup).toContain("local processing");
    expect(markup).toContain("Continue to validation");
  });
});
