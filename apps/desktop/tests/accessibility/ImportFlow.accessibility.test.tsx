import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SingleEntryFileImportDialog } from "../../src/modules/import-export/overlays/SingleEntryFileImportDialog";

describe("Import flow accessibility", () => {
  it("exposes a named modal and explicit local-processing guidance", () => {
    const markup = renderToStaticMarkup(
      <SingleEntryFileImportDialog onClose={() => undefined} onContinue={() => undefined} open />
    );

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain("Import one vocabulary entry");
    expect(markup).toContain("local processing");
    expect(markup).toContain("Continue to validation");
  });
});
