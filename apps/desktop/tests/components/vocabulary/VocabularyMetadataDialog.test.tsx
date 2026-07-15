import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { maintainVocabularyEntry } from "../../../src/content";
import { VocabularyMetadataDialog } from "../../../src/modules/vocabulary/components";
import { createVocabularyUserMetadataBuilder } from "@platform/testing";

const metadata = createVocabularyUserMetadataBuilder()
  .with({
    normalizedWord: "maintain",
    favorite: true,
    learningStatus: "learning",
    reviewStatus: "reviewed",
    note: "Use with standards and conditions."
  })
  .build();

const markup = renderToStaticMarkup(
  <VocabularyMetadataDialog
    entry={maintainVocabularyEntry}
    metadata={metadata}
    onClose={() => undefined}
    onSave={async () => undefined}
    open
    saving={false}
  />
);

describe("VocabularyMetadataDialog", () => {
  it("renders all editable personal metadata fields", () => {
    expect(markup).toContain("Edit personal study details");
    expect(markup).toContain("Favorited");
    expect(markup).toContain("Learning status");
    expect(markup).toContain("Review status");
    expect(markup).toContain("Personal note");
    expect(markup).toContain("SQLite · local only");
  });
});
