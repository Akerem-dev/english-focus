import { z } from "zod";

import { backupDescriptorSchema } from "./backup-manifest.schema";

export const restorePlanSchema = z
  .object({
    backup: backupDescriptorSchema,
    createsSafetyBackup: z.literal(true),
    replacesVocabularyEntries: z.boolean(),
    replacesVocabularyMetadata: z.boolean(),
    replacesSettings: z.boolean()
  })
  .strict();
