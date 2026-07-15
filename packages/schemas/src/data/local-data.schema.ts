import { z } from "zod";

import { backupDescriptorSchema } from "../backup";

export const localDataCategorySchema = z.enum([
  "study-metadata",
  "user-vocabulary",
  "overrides",
  "settings",
  "activity",
  "backups"
]);

export const localDataSnapshotSchema = z
  .object({
    studyMetadataRecords: z.number().int().nonnegative(),
    userVocabularyEntries: z.number().int().nonnegative(),
    overrideVocabularyEntries: z.number().int().nonnegative(),
    settingsRecords: z.number().int().nonnegative(),
    activityRecords: z.number().int().nonnegative(),
    backupFiles: z.number().int().nonnegative()
  })
  .strict();

export const resetLocalDataResultSchema = z
  .object({
    deleted: localDataSnapshotSchema,
    safetyBackup: backupDescriptorSchema.optional()
  })
  .strict();
