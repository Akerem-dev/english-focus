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

const nullableSafetyBackupSchema = z.union([backupDescriptorSchema, z.null()]).optional();

export const backupDeletionResultSchema = z
  .object({
    requested: z.boolean(),
    deletedFiles: z.number().int().nonnegative(),
    failedFiles: z.number().int().nonnegative()
  })
  .strict();

const noBackupDeletion = Object.freeze({
  requested: false,
  deletedFiles: 0,
  failedFiles: 0
});

export const resetLocalDataResultNativeCompatibilitySchema = z
  .object({
    deleted: localDataSnapshotSchema,
    safetyBackup: nullableSafetyBackupSchema,
    backupDeletion: backupDeletionResultSchema.optional()
  })
  .strict();

export const resetLocalDataResultSchema = resetLocalDataResultNativeCompatibilitySchema.transform(
  (result) => ({
    ...result,
    safetyBackup: result.safetyBackup ?? undefined,
    backupDeletion: result.backupDeletion ?? noBackupDeletion
  })
);
