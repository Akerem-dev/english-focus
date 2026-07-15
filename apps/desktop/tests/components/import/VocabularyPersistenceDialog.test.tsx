import { renderToStaticMarkup } from "react-dom/server";
import { createValidVocabularyEntry } from "@platform/testing";
import { describe, expect, it } from "vitest";

import { VocabularyPersistenceDialog } from "../../../src/modules/import-export/overlays";

const entry = createValidVocabularyEntry({
  id: "user.allocate.persistence-dialog",
  word: "allocate",
  normalizedWord: "allocate",
  source: { kind: "user" }
});
const callbacks = {
  onBack: () => undefined,
  onClose: () => undefined,
  onOpenEntry: () => undefined,
  onSave: () => undefined
};

describe("VocabularyPersistenceDialog", () => {
  it("renders the explicit pre-save confirmation", () => {
    const markup = renderToStaticMarkup(
      <VocabularyPersistenceDialog
        {...callbacks}
        open
        plan={{
          kind: "save",
          entry,
          layer: "user",
          actionLabel: "Add new entry",
          summary: "The reviewed entry will be stored locally."
        }}
        status="ready"
      />
    );

    expect(markup).toContain("Save vocabulary entry");
    expect(markup).toContain("SQLite local storage");
    expect(markup).toContain("Add new entry");
    expect(markup).toContain("Word:");
    expect(markup).toContain("Storage action:");
    expect(markup).toContain("Preserved separately");
  });

  it("renders restart proof after a successful save", () => {
    const markup = renderToStaticMarkup(
      <VocabularyPersistenceDialog
        {...callbacks}
        open
        outcome={{ kind: "saved", record: { entry, layer: "user" } }}
        plan={{
          kind: "save",
          entry,
          layer: "user",
          actionLabel: "Add new entry",
          summary: "The reviewed entry was stored locally."
        }}
        status="success"
      />
    );

    expect(markup).toContain("Saved to local library");
    expect(markup).toContain("Restart proof");
    expect(markup).toContain("Open vocabulary entry");
  });
});
