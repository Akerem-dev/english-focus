import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { maintainVocabularyEntry } from "../../../src/content";
import { VocabularyEntryEditorDialog } from "../../../src/modules/vocabulary/components";

describe("VocabularyEntryEditorDialog", () => {
  it("renders the direct editor for essential vocabulary content", () => {
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

    expect(markup).toContain("Edit vocabulary entry");
    expect(markup).toContain("Creates local override");
    expect(markup).toContain("The bundled core record stays unchanged.");
    expect(markup).toContain("Turkish translations");
    expect(markup).toContain("Pronunciation");
    expect(markup).toContain("Word forms");
    expect(markup).toContain("Short usage explanation");
    expect(markup).toContain("Three example sentences");
    expect(markup).toContain("Optional etymology");
    expect(markup).toContain("Save entry");
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
