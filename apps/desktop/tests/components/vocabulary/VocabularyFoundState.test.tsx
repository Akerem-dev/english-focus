import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { maintainVocabularyEntry } from "../../../src/content";
import { VocabularyFoundState } from "../../../src/modules/vocabulary/components";

const markup = renderToStaticMarkup(
  <VocabularyFoundState
    entry={maintainVocabularyEntry}
    onBack={() => undefined}
    onEditMetadata={() => undefined}
    onExport={() => undefined}
    onImportReplacement={() => undefined}
  />
);

describe("VocabularyFoundState", () => {
  it("renders the reviewed maintain entry from validated content", () => {
    expect(markup).toContain("maintain");
    expect(markup).toContain("Import replacement JSON");
    expect(markup).toContain("sürdürmek");
    expect(markup).toContain("CEFR B2");
    expect(markup).toContain("Editorially reviewed");
  });

  it("renders complete meanings, grammar, and supporting vocabulary sections", () => {
    expect(markup).toContain("Meanings");
    expect(markup).toContain("Grammar patterns");
    expect(markup).toContain("Tense examples");
    expect(markup).toContain("Sentence forms");
    expect(markup).toContain("Preposition patterns");
    expect(markup).toContain("Collocations");
    expect(markup).toContain("Word family");
    expect(markup).toContain("Related words");
    expect(markup).toContain("Common mistakes");
    expect(markup).toContain("Etymology");
  });

  it("renders the first three primary examples without a count chip", () => {
    expect(markup.match(/class="example-sentence-row"/g)).toHaveLength(3);
    expect(markup).toContain("The hospital must maintain high standards of hygiene at all times.");
    expect(markup).toContain("Hastane her zaman yüksek hijyen standartlarını korumalıdır.");
    expect(markup).toContain("The technicians maintain the machines every three months.");
    expect(markup).not.toContain("She has maintained close contact with her former research team.");
    expect(markup).not.toContain("Exactly 10");
  });

  it("does not create empty phrasal-verb or idiom sections", () => {
    expect(markup).not.toContain("Phrasal verbs");
    expect(markup).not.toContain("Idioms");
  });
});
