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
        createdAt: "2026-01-01T00:00:00.000Z"
      }
    ]
  })
  .build();

const markup = renderToStaticMarkup(
  <VocabularyFoundState
    backLabel="Back to Library"
    entry={maintainVocabularyEntry}
    metadata={metadata}
    onBack={() => undefined}
    onEditEntry={() => undefined}
    onEditMetadata={() => undefined}
    onExport={() => undefined}
    onImportReplacement={() => undefined}
  />
);

describe("VocabularyFoundState", () => {
  it("keeps the route-aware back label while presenting the rebuilt back action", () => {
    expect(markup).toContain('aria-label="Back to Library"');
    expect(markup).toContain("Back to results");
  });

  it("keeps word management available without exposing technical JSON language", () => {
    expect(markup).toContain("maintain");
    expect(markup).toContain('aria-label="Word options"');
    expect(markup).toContain("Edit word details");
    expect(markup).toContain("Notes &amp; learning status");
    expect(markup).toContain("Replace word data");
    expect(markup).toContain("Download word data");
    expect(markup).not.toContain("Advanced JSON tools");
    expect(markup).not.toContain("Import replacement");
    expect(markup).not.toContain("Export entry JSON");
  });

  it("renders the essential vocabulary identity without legacy review metadata chips", () => {
    expect(markup).toContain("sürdürmek");
    expect(markup).toContain('class="wvsr-detail-cefr">B2</span>');
    expect(markup).toContain("/meɪnˈteɪn/");
    expect(markup).not.toContain("Editorially reviewed");
    expect(markup).not.toContain(">Known<");
    expect(markup).not.toContain(">Reviewed<");
    expect(markup).not.toContain(">IELTS<");
  });

  it("renders the package 3 detail tabs and definition-first content model", () => {
    expect(markup).toContain('wvsr-detail-root--package-three');
    expect(markup).toContain('aria-label="Vocabulary entry sections"');
    expect(markup).toContain(">Definition<");
    expect(markup).toContain(">Examples<");
    expect(markup).toContain(">Similar words<");
    expect(markup).toContain(">Word forms<");
    expect(markup).toContain("English Definition");
    expect(markup).toContain("Türkçe Anlamı");
    expect(markup).toContain("Example Sentence");

    expect(markup).not.toContain("Grammar patterns");
    expect(markup).not.toContain("Tense examples");
    expect(markup).not.toContain("Sentence forms");
    expect(markup).not.toContain("Preposition patterns");
    expect(markup).not.toContain("Common mistakes");
  });

  it("keeps the context rail visible by default with an explicit collapse control", () => {
    expect(markup).toContain('aria-controls="wvsr-detail-context-rail"');
    expect(markup).toContain('aria-expanded="true"');
    expect(markup).toContain('aria-label="Hide side panel"');
    expect(markup).toContain('id="wvsr-detail-context-rail"');
    expect(markup).toContain("RECENTLY VIEWED");
    expect(markup).toContain("RECENT ADDITIONS");
    expect(markup).toContain('aria-label="Wordie vocabulary assistant"');
    expect(markup).toContain("Ask Wordie");
  });

  it("shows the verified primary example on the definition tab", () => {
    expect(markup).toContain("The hospital must maintain high standards of hygiene at all times.");
    expect(markup).toContain("Hastane her zaman yüksek hijyen standartlarını korumalıdır.");
    expect(markup).not.toContain("The technicians maintain the machines every three months.");
    expect(markup).not.toContain("Exactly 10");
  });

  it("does not create phrasal-verb or idiom sections", () => {
    expect(markup).not.toContain("Phrasal verbs");
    expect(markup).not.toContain("Idioms");
  });
});
