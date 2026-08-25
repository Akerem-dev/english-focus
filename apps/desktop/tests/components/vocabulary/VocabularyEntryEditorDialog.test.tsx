import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { maintainVocabularyEntry } from "../../../src/content";
import { VocabularyEntryEditorDialog } from "../../../src/modules/vocabulary/components";

describe("VocabularyEntryEditorDialog", () => {
  it("renders the direct editor without exposing storage-layer terminology", () => {
    const markup = renderToStaticMarkup(
      <VocabularyEntryEditorDialog
        entry={maintainVocabularyEntry}
        layer="override"
        onClose={() => undefined}
        onSave={async (input) => ({ entry: input.entry, layer: input.layer })}
        open
        saving={false}
      />
    );

    expect(markup).toContain("Edit “maintain”");
    expect(markup).not.toContain("Creates local override");
    expect(markup).not.toContain("The bundled core record stays unchanged.");
    expect(markup).toContain("Turkish meaning");
    expect(markup).toContain("Pronunciation");
    expect(markup).toContain("Word forms");
    expect(markup).toContain("Usage notes");
    expect(markup).toContain("Example 1");
    expect(markup).toContain("Example 2");
    expect(markup).toContain("Example 3");
    expect(markup).toContain("Word origin");
    expect(markup).toContain("Save changes");
    expect(markup.match(/English sentence/g)).toHaveLength(3);
  });

  it("renders nothing while closed", () => {
    const markup = renderToStaticMarkup(
      <VocabularyEntryEditorDialog
        entry={maintainVocabularyEntry}
        layer="override"
        onClose={() => undefined}
        onSave={async (input) => ({ entry: input.entry, layer: input.layer })}
        open={false}
        saving={false}
      />
    );

    expect(markup).toBe("");
  });
});
