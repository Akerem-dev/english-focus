import { describe, expect, it } from "vitest";

import { appSettingsInputSchema, appSettingsSchema } from "../src";

const validSettings = {
  schemaVersion: "1.0.0",
  general: {
    interfaceLanguage: "en",
    translationLanguage: "tr"
  },
  content: {
    showEtymology: true
  },
  data: {
    automaticBackups: true,
    backupFrequency: "daily"
  },
  appearance: {
    theme: "system",
    reducedMotion: false,
    interfaceSize: "medium"
  },
  instruction: {
    explanationLanguage: "tr",
    detailLevel: "maximum",
    targetProficiency: "C1",
    includeGrammarNotes: true,
    includeEtymology: true,
    includeUsageTips: true
  },
  updatedAt: "2026-07-15T18:00:00.000Z"
} as const;

describe("appSettingsSchema", () => {
  it("accepts the simplified persisted settings contract", () => {
    expect(appSettingsSchema.parse(validSettings)).toEqual(validSettings);
  });

  it("normalizes removed legacy settings on read", () => {
    const result = appSettingsInputSchema.parse({
      ...validSettings,
      content: {
        ...validSettings.content,
        showCommonMistakes: true,
        exampleSentenceCount: 10
      },
      instruction: {
        ...validSettings.instruction,
        exampleCount: 10,
        includeWordFamily: true,
        includeCommonMistakes: true
      }
    });

    expect(result).toEqual(validSettings);
  });

  it("rejects unsupported appearance values", () => {
    expect(() =>
      appSettingsSchema.parse({
        ...validSettings,
        appearance: { ...validSettings.appearance, theme: "sepia" }
      })
    ).toThrow();
  });
});
