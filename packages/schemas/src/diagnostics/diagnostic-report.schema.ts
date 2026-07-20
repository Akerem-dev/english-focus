import { z } from "zod";

export const diagnosticCheckSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    status: z.enum(["passed", "warning", "failed"]),
    summary: z.string().min(1),
    details: z.array(z.string()),
    repairable: z.boolean()
  })
  .strict();

export const diagnosticCountsSchema = z
  .object({
    vocabularyEntries: z.number().int().nonnegative(),
    vocabularyMetadata: z.number().int().nonnegative(),
    settingsRecords: z.number().int().nonnegative(),
    retainedBackups: z.number().int().nonnegative(),
    invalidVocabularyJson: z.number().int().nonnegative(),
    invalidMetadataJson: z.number().int().nonnegative(),
    invalidSettingsJson: z.number().int().nonnegative(),
    normalizedWordMismatches: z.number().int().nonnegative()
  })
  .strict();

export const diagnosticReportSchema = z
  .object({
    generatedAt: z.string().datetime({ offset: true }),
    appVersion: z.string().min(1),
    databaseSchemaVersion: z.string().min(1),
    overallStatus: z.enum(["healthy", "attention", "critical"]),
    checks: z.array(diagnosticCheckSchema),
    counts: diagnosticCountsSchema,
    recommendations: z.array(z.string())
  })
  .strict();

export const safeMaintenanceResultSchema = z
  .object({
    completedAt: z.string().datetime({ offset: true }),
    actions: z.array(z.string()),
    report: diagnosticReportSchema
  })
  .strict();

export const diagnosticScanCoverageSchema = z
  .object({
    complete: z.boolean(),
    issues: z.array(z.string().trim().min(1))
  })
  .strict();
