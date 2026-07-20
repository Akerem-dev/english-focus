import { createVocabularyUserMetadataBuilder } from "@platform/testing";
import { describe, expect, it } from "vitest";

import { createCoreVocabularyContentSource } from "../../../src/infrastructure/content";
import { SearchVocabulary } from "../../../src/modules/search";

const contentSource = createCoreVocabularyContentSource();
const searchVocabulary = new SearchVocabulary(contentSource);
const metadata = createVocabularyUserMetadataBuilder()
  .with({
    normalizedWord: "maintain",
    note: "Weekly review for the IELTS essay list",
    tags: [
      {
        id: "tag-exam",
        name: "Exam vocabulary",
        normalizedName: "exam vocabulary",
        createdAt: "2026-07-20T00:00:00.000Z"
      }
    ]
  })
  .build();
const searchWithMetadata = new SearchVocabulary(contentSource, [metadata]);

describe("SearchVocabulary", () => {
  it.each(["maintain", " Maintain ", "MAINTAIN"])("finds exact query %s", (query) => {
    const result = searchVocabulary.execute(query);

    expect(result.kind).toBe("found");
    if (result.kind === "found") {
      expect(result.entry.normalizedWord).toBe("maintain");
      expect(result.matchKind).toBe("exact");
    }
  });

  it.each(["maintains", "maintained", "maintaining"])("resolves inflected query %s", (query) => {
    const result = searchVocabulary.execute(query);

    expect(result.kind).toBe("found");
    if (result.kind === "found") {
      expect(result.entry.normalizedWord).toBe("maintain");
      expect(result.matchKind).toBe("alias");
      expect(result.matchedForm).toBe(query);
    }
  });

  it("returns ranked prefix matches without opening an approximate word", () => {
    expect(searchVocabulary.execute("maint")).toMatchObject({
      kind: "matches",
      matches: [
        {
          entry: { normalizedWord: "maintain" },
          matchKind: "prefix",
          matchedField: "word"
        }
      ]
    });
  });

  it("finds Turkish translations without requiring Turkish diacritics", () => {
    expect(searchVocabulary.execute("surdur")).toMatchObject({
      kind: "matches",
      matches: [
        {
          entry: { normalizedWord: "maintain" },
          matchedField: "translation",
          matchedText: "sürdürmek"
        }
      ]
    });
  });

  it("finds English definition phrases with full-text matching", () => {
    expect(searchVocabulary.execute("same condition")).toMatchObject({
      kind: "matches",
      matches: [
        {
          entry: { normalizedWord: "maintain" },
          matchKind: "full-text",
          matchedField: "definition"
        }
      ]
    });
  });

  it("finds personal tags and notes from user-owned metadata", () => {
    expect(searchWithMetadata.execute("exam")).toMatchObject({
      kind: "matches",
      matches: [{ matchedField: "tag" }]
    });
    expect(searchWithMetadata.execute("weekly review")).toMatchObject({
      kind: "matches",
      matches: [{ matchedField: "note", matchKind: "full-text" }]
    });
  });

  it("returns not-found for a valid unknown word", () => {
    expect(searchVocabulary.execute("allocate")).toMatchObject({
      kind: "not-found",
      normalizedQuery: "allocate"
    });
  });

  it("suggests maintain for a close misspelling", () => {
    expect(searchVocabulary.execute("maintan")).toMatchObject({
      kind: "not-found",
      suggestions: ["maintain"]
    });
  });

  it("does not offer single-word spelling guesses for a full-text query", () => {
    expect(searchVocabulary.execute("missing phrase")).toMatchObject({
      kind: "not-found",
      canCreateEntry: false,
      suggestions: []
    });
  });

  it("does not treat folded Turkish text as an English entry-creation target", () => {
    expect(searchVocabulary.execute("sürdürülmeyen")).toMatchObject({
      kind: "not-found",
      canCreateEntry: false,
      suggestions: []
    });
  });

  it.each(["", "maintain?", "***"])("returns invalid for %s", (query) => {
    expect(searchVocabulary.execute(query).kind).toBe("invalid");
  });
});
