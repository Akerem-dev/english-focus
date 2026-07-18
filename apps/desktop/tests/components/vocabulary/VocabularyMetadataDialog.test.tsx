import { createVocabularyUserMetadataBuilder } from "@platform/testing";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { maintainVocabularyEntry } from "../../../src/content";
import { VocabularyMetadataDialog } from "../../../src/modules/vocabulary/components";

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
  it("renders personal details without technical storage labels", () => {
    expect(markup).toContain("Edit personal details");
    expect(markup).toContain("Favorited");
    expect(markup).toContain("Tags");
    expect(markup).toContain("Personal note");
    expect(markup).toContain("Views");
    expect(markup).toContain("Last viewed");
    expect(markup).not.toContain("SQLite · local only");
    expect(markup).not.toContain(">Storage<");
    expect(markup).not.toContain("Learning status");
    expect(markup).not.toContain("Review status");
    expect(markup).not.toContain(">Known<");
    expect(markup).not.toContain(">Reviewed<");
  });
});
