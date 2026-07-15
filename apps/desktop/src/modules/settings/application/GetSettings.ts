import type { AppSettings } from "@platform/domain";
import { appSettingsSchema } from "@platform/schemas";

import { createDefaultInstructionPreferences } from "../../instruction/services";

export function createDefaultAppSettings(now = new Date().toISOString()): AppSettings {
  return Object.freeze({
    schemaVersion: "1.0.0",
    general: Object.freeze({
      interfaceLanguage: "en",
      translationLanguage: "tr"
    }),
    content: Object.freeze({
      showEtymology: true,
      showCommonMistakes: true,
      exampleSentenceCount: 10
    }),
    data: Object.freeze({
      automaticBackups: true,
      backupFrequency: "daily"
    }),
    appearance: Object.freeze({
      theme: "system",
      reducedMotion: false,
      interfaceSize: "medium"
    }),
    instruction: createDefaultInstructionPreferences(),
    updatedAt: now
  });
}

export function validateAppSettings(settings: AppSettings): AppSettings {
  return Object.freeze(appSettingsSchema.parse(settings));
}
