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
    checksum: z.string().regex(/^[0-9a-f]{16}$/),
    counts: backupCountsSchema
  })
  .strict();

export const backupValidationResultSchema = z
  .object({
    valid: z.boolean(),
    issues: z.array(z.string()),
    descriptor: backupDescriptorSchema.optional()
  })
  .strict();

export const backupRestoreResultSchema = z
  .object({
    restoredAt: z.string().datetime({ offset: true }),
    restored: backupCountsSchema,
    sourceBackup: backupDescriptorSchema,
    safetyBackup: backupDescriptorSchema
  })
  .strict();
