import type { AppSettings } from "@platform/domain";
import { z } from "zod";

import { cefrLevelSchema } from "../vocabulary/vocabulary-enums.schema";
import {
  instructionDetailLevelSchema,
  instructionPreferencesSchema
} from "./instruction-settings.schema";

export const themePreferenceSchema = z.enum(["light", "dark", "system"]);
export const interfaceSizeSchema = z.enum(["compact", "medium", "large"]);
export const backupFrequencySchema = z.enum(["daily", "weekly", "manual"]);

const baseSettingsShape = {
  schemaVersion: z.literal("1.0.0"),
  general: z.strictObject({
    interfaceLanguage: z.literal("en"),
    translationLanguage: z.literal("tr")
  }),
  data: z.strictObject({
    automaticBackups: z.boolean(),
    backupFrequency: backupFrequencySchema
  }),
  appearance: z.strictObject({
    theme: themePreferenceSchema,
    reducedMotion: z.boolean(),
    interfaceSize: interfaceSizeSchema
  }),
  updatedAt: z.string().datetime({ offset: true })
} as const;

export const appSettingsSchema: z.ZodType<AppSettings> = z.strictObject({
  ...baseSettingsShape,
  content: z.strictObject({
    showEtymology: z.boolean()
  }),
  instruction: instructionPreferencesSchema
});

const legacyAppSettingsSchema = z.strictObject({
  ...baseSettingsShape,
  content: z.strictObject({
    showEtymology: z.boolean(),
    showCommonMistakes: z.boolean().optional(),
    exampleSentenceCount: z.union([z.literal(5), z.literal(10)]).optional()
  }),
  instruction: z.strictObject({
    explanationLanguage: z.literal("tr"),
    detailLevel: instructionDetailLevelSchema,
    targetProficiency: cefrLevelSchema,
    exampleCount: z.literal(10).optional(),
    includeWordFamily: z.boolean().optional(),
    includeGrammarNotes: z.boolean(),
    includeCommonMistakes: z.boolean().optional(),
    includeEtymology: z.boolean(),
    includeUsageTips: z.boolean()
  })
});

export const appSettingsNativeCompatibilitySchema = z.union([
  appSettingsSchema,
  legacyAppSettingsSchema
]);

function normalizeLegacySettings(value: unknown): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value;
  }

  const candidate = value as Record<string, unknown>;
  const content =
    typeof candidate.content === "object" && candidate.content !== null
      ? (candidate.content as Record<string, unknown>)
      : undefined;
  const instruction =
    typeof candidate.instruction === "object" && candidate.instruction !== null
      ? (candidate.instruction as Record<string, unknown>)
      : undefined;

  return {
    ...candidate,
    ...(content === undefined
      ? {}
      : {
          content: {
            showEtymology: content.showEtymology
          }
        }),
    ...(instruction === undefined
      ? {}
      : {
          instruction: {
            explanationLanguage: instruction.explanationLanguage,
            detailLevel: instruction.detailLevel,
            targetProficiency: instruction.targetProficiency,
            includeGrammarNotes: instruction.includeGrammarNotes,
            includeEtymology: instruction.includeEtymology,
            includeUsageTips: instruction.includeUsageTips
          }
        })
  };
}

export const appSettingsInputSchema: z.ZodType<AppSettings> = z.preprocess(
  normalizeLegacySettings,
  appSettingsSchema
);
