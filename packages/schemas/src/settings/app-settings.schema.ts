import type { AppSettings } from "@platform/domain";
import { z } from "zod";

import { instructionPreferencesSchema } from "./instruction-settings.schema";

export const themePreferenceSchema = z.enum(["light", "dark", "system"]);
export const interfaceSizeSchema = z.enum(["compact", "medium", "large"]);
export const backupFrequencySchema = z.enum(["daily", "weekly", "manual"]);

export const appSettingsSchema: z.ZodType<AppSettings> = z.strictObject({
  schemaVersion: z.literal("1.0.0"),
  general: z.strictObject({
    interfaceLanguage: z.literal("en"),
    translationLanguage: z.literal("tr")
  }),
  content: z.strictObject({
    showEtymology: z.boolean(),
    showCommonMistakes: z.boolean(),
    exampleSentenceCount: z.union([z.literal(5), z.literal(10)])
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
  instruction: instructionPreferencesSchema,
  updatedAt: z.string().datetime({ offset: true })
});
