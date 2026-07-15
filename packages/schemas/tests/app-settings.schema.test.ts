import { describe, expect, it } from "vitest";

import { appSettingsSchema } from "../src";

const validSettings = {
  schemaVersion: "1.0.0",
  general: {
    interfaceLanguage: "en",
    translationLanguage: "tr"
  },
  content: {
    showEtymology: true,
    showCommonMistakes: true,
    exampleSentenceCount: 10
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
    exampleCount: 10,
    includeWordFamily: true,
    includeGrammarNotes: true,
    includeCommonMistakes: true,
    includeEtymology: true,
    includeUsageTips: true
  },
  updatedAt: "2026-07-15T18:00:00.000Z"
} as const;

describe("appSettingsSchema", () => {
  it("accepts the persisted V1 settings contract", () => {
    expect(appSettingsSchema.parse(validSettings)).toEqual(validSettings);
  });

  it("rejects unsupported appearance and content values", () => {
    expect(() =>
      appSettingsSchema.parse({
        ...validSettings,
        content: { ...validSettings.content, exampleSentenceCount: 15 },
        appearance: { ...validSettings.appearance, theme: "sepia" }
      })
    ).toThrow();
  });
});
