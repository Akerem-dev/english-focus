import { createValidVocabularyEntry } from "@platform/testing";
import { describe, expect, it } from "vitest";

import {
  prepareVocabularyEntryEdit,
  resolveVocabularyEditLayer,
} from "../../../src/modules/vocabulary/application";

describe("prepareVocabularyEntryEdit", () => {
  it("turns a bundled entry edit into a validated local override", () => {
    const original = createValidVocabularyEntry({
      source: {
        kind: "core",
        sourceId: "english-focus-core-v1",
        sourceLabel: "English Focus Core Vocabulary",
      },
    });
    const draft = structuredClone(original);
    draft.cefr = "C1";
    draft.meanings = [
      {
        ...draft.meanings[0]!,
        translationsTr: [" sürdürmek, korumak "],
      },
    ];

    const result = prepareVocabularyEntryEdit({
      original,
      draft,
      layer: "override",
      updatedAt: "2026-07-17T20:00:00.000Z",
    });

    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.input.layer).toBe("override");
      expect(result.input.entry.source.kind).toBe("override");
      expect(result.input.entry.source.sourceLabel).toBe(
        "Local edit of bundled vocabulary",
      );
      expect(result.input.entry.generation.method).toBe("manual");
      expect(result.input.entry.generation.validationStatus).toBe(
        "schema-valid",
      );
      expect(result.input.entry.cefr).toBe("C1");
      expect(result.input.entry.meanings[0]?.translationsTr).toEqual([
        "sürdürmek",
        "korumak",
      ]);
      expect(result.input.entry.examples).toHaveLength(3);
    }
  });

  it("keeps existing user entries in the user layer", () => {
    const original = createValidVocabularyEntry({
      source: {
        kind: "user",
        sourceId: "manual-entry",
        sourceLabel: "Local vocabulary",
      },
    });
    const draft = structuredClone(original);
    draft.grammar = {
      ...draft.grammar,
      summaryTr: " Düzenlenmiş kısa kullanım açıklaması. ",
    };

    const result = prepareVocabularyEntryEdit({
      original,
      draft,
      layer: "user",
      updatedAt: "2026-07-17T20:00:00.000Z",
    });

    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.input.layer).toBe("user");
      expect(result.input.entry.source.kind).toBe("user");
      expect(result.input.entry.grammar.summaryTr).toBe(
        "Düzenlenmiş kısa kullanım açıklaması.",
      );
    }
  });

  it("rejects changing the normalized headword identity", () => {
    const original = createValidVocabularyEntry();
    const draft = structuredClone(original);
    draft.word = "replace";

    const result = prepareVocabularyEntryEdit({
      original,
      draft,
      layer: "override",
      updatedAt: "2026-07-17T20:00:00.000Z",
    });

    expect(result).toEqual(
      expect.objectContaining({
        kind: "failure",
        issues: [
          expect.objectContaining({
            path: "word",
          }),
        ],
      }),
    );
  });

  it("returns field paths for invalid editable content", () => {
    const original = createValidVocabularyEntry();
    const draft = structuredClone(original);
    draft.examples = draft.examples.map((example, index) =>
      index === 0 ? { ...example, translationTr: "" } : example,
    );

    const result = prepareVocabularyEntryEdit({
      original,
      draft,
      layer: "override",
      updatedAt: "2026-07-17T20:00:00.000Z",
    });

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "examples[0].translationTr",
          }),
        ]),
      );
    }
  });
});

describe("resolveVocabularyEditLayer", () => {
  it("creates an override for bundled entries and preserves stored layers", () => {
    const entry = createValidVocabularyEntry();

    expect(resolveVocabularyEditLayer(entry.normalizedWord, [])).toBe(
      "override",
    );
    expect(
      resolveVocabularyEditLayer(entry.normalizedWord, [
        {
          entry,
          layer: "user",
        },
      ]),
    ).toBe("user");
  });
});
