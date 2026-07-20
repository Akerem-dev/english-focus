import { z } from "zod";

const backupReasonSchema = z.enum(["manual", "automatic", "pre-restore"]);

export const backupCountsSchema = z
  .object({
    vocabularyEntries: z.number().int().nonnegative(),
    vocabularyMetadata: z.number().int().nonnegative(),
    settingsRecords: z.number().int().nonnegative()
  })
  .strict();

export const backupDescriptorSchema = z
  .object({
    fileName: z.string().min(1),
    createdAt: z.string().datetime({ offset: true }),
    reason: backupReasonSchema,
    sizeBytes: z.number().int().nonnegative(),
    backupVersion: z.literal("1.0.0"),
    databaseSchemaVersion: z.enum(["2", "3"]),
    checksum: z.string().regex(/^(?:[0-9a-f]{16}|[0-9a-f]{64})$/),
    counts: backupCountsSchema
  })
  .strict();

export const unavailableBackupSchema = z
  .object({
    fileName: z.string().min(1),
    sizeBytes: z.number().int().nonnegative(),
    issue: z.string().min(1)
  })
  .strict();

const nullableBackupDescriptorSchema = z.union([backupDescriptorSchema, z.null()]).optional();

export const backupValidationResultNativeCompatibilitySchema = z
  .object({
    valid: z.boolean(),
    issues: z.array(z.string()),
    descriptor: nullableBackupDescriptorSchema
  })
  .strict();

export const backupValidationResultSchema =
  backupValidationResultNativeCompatibilitySchema.transform((result) => ({
    ...result,
    descriptor: result.descriptor ?? undefined
  }));

export const backupRestoreResultSchema = z
  .object({
    restoredAt: z.string().datetime({ offset: true }),
    restored: backupCountsSchema,
    sourceBackup: backupDescriptorSchema,
    safetyBackup: backupDescriptorSchema
  })
  .strict();
