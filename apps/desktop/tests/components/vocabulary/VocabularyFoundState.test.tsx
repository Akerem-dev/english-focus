import { createVocabularyUserMetadataBuilder } from "@platform/testing";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { maintainVocabularyEntry } from "../../../src/content";
import { VocabularyFoundState } from "../../../src/modules/vocabulary/components";

const metadata = createVocabularyUserMetadataBuilder()
  .with({
    normalizedWord: "maintain",
    learningStatus: "known",
    reviewStatus: "reviewed",
    tags: [
      {
        id: "tag.ielts",
        name: "IELTS",
        normalizedName: "ielts",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
  })
  .build();

const markup = renderToStaticMarkup(
  <VocabularyFoundState
    entry={maintainVocabularyEntry}
    metadata={metadata}
    onBack={() => undefined}
    onEditEntry={() => undefined}
    onEditMetadata={() => undefined}
    onExport={() => undefined}
    onImportReplacement={() => undefined}
  />,
);

describe("VocabularyFoundState", () => {
  it("makes direct editing primary while keeping JSON import advanced", () => {
    expect(markup).toContain("maintain");
    expect(markup).toContain("Edit entry");
    expect(markup).toContain("Import JSON");
    expect(markup).toContain('title="Advanced JSON replacement"');
    expect(markup).not.toContain("Import replacement JSON");
  });

  it("renders essential vocabulary identity without review or learning-status chips", () => {
    expect(markup).toContain("sürdürmek");
    expect(markup).toContain("CEFR B2");
    expect(markup).toContain("IELTS");
    expect(markup).not.toContain("Editorially reviewed");
    expect(markup).not.toContain(">Known<");
    expect(markup).not.toContain(">Reviewed<");
  });

  it("renders only the simplified vocabulary sections", () => {
    expect(markup).toContain("Usage overview");
    expect(markup).toContain("Meanings");
    expect(markup).toContain("Example sentences");
    expect(markup).toContain("Pronunciation");
    expect(markup).toContain("Word forms");
    expect(markup).toContain("Etymology");

    expect(markup).not.toContain("Grammar patterns");
    expect(markup).not.toContain("Tense examples");
    expect(markup).not.toContain("Sentence forms");
    expect(markup).not.toContain("Preposition patterns");
    expect(markup).not.toContain("Collocations");
    expect(markup).not.toContain("Word family");
    expect(markup).not.toContain("Related words");
    expect(markup).not.toContain("Common mistakes");
  });

  it("renders the first three primary examples without a count chip", () => {
    expect(markup.match(/class="example-sentence-row"/g)).toHaveLength(3);
    expect(markup).toContain(
      "The hospital must maintain high standards of hygiene at all times.",
    );
    expect(markup).toContain(
      "Hastane her zaman yüksek hijyen standartlarını korumalıdır.",
    );
    expect(markup).toContain(
      "The technicians maintain the machines every three months.",
    );
    expect(markup).not.toContain("Exactly 10");
  });

  it("does not create phrasal-verb or idiom sections", () => {
    expect(markup).not.toContain("Phrasal verbs");
    expect(markup).not.toContain("Idioms");
  });
});
