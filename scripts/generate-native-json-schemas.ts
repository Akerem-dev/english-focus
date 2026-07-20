import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { format, resolveConfig } from "prettier";

import {
  activityRecordNativeCompatibilitySchema,
  appSettingsNativeCompatibilitySchema,
  backupDescriptorSchema,
  backupRestoreResultSchema,
  backupValidationResultNativeCompatibilitySchema,
  diagnosticReportSchema,
  diagnosticScanCoverageSchema,
  localDataSnapshotSchema,
  resetLocalDataResultNativeCompatibilitySchema,
  safeMaintenanceResultSchema,
  unavailableBackupSchema,
  vocabularyEntryNativeCompatibilitySchema,
  vocabularyUserMetadataSchema
} from "@platform/schemas";
import { z } from "zod";

const root = resolve(import.meta.dirname, "..");
const prettierConfig = (await resolveConfig(resolve(root, "package.json"))) ?? {};
const checkOnly = process.argv.includes("--check");
const outputs = [
  {
    path: "apps/desktop/src-tauri/schemas/vocabulary-entry.schema.json",
    schema: vocabularyEntryNativeCompatibilitySchema
  },
  {
    path: "apps/desktop/src-tauri/schemas/app-settings.schema.json",
    schema: appSettingsNativeCompatibilitySchema
  },
  {
    path: "apps/desktop/src-tauri/schemas/vocabulary-user-metadata.schema.json",
    schema: vocabularyUserMetadataSchema
  },
  {
    path: "apps/desktop/src-tauri/schemas/activity-record.schema.json",
    schema: activityRecordNativeCompatibilitySchema
  },
  {
    path: "apps/desktop/src-tauri/schemas/backup-descriptor.schema.json",
    schema: backupDescriptorSchema
  },
  {
    path: "apps/desktop/src-tauri/schemas/backup-validation-result.schema.json",
    schema: backupValidationResultNativeCompatibilitySchema
  },
  {
    path: "apps/desktop/src-tauri/schemas/backup-restore-result.schema.json",
    schema: backupRestoreResultSchema
  },
  {
    path: "apps/desktop/src-tauri/schemas/unavailable-backup.schema.json",
    schema: unavailableBackupSchema
  },
  {
    path: "apps/desktop/src-tauri/schemas/diagnostic-report.schema.json",
    schema: diagnosticReportSchema
  },
  {
    path: "apps/desktop/src-tauri/schemas/safe-maintenance-result.schema.json",
    schema: safeMaintenanceResultSchema
  },
  {
    path: "apps/desktop/src-tauri/schemas/diagnostic-scan-coverage.schema.json",
    schema: diagnosticScanCoverageSchema
  },
  {
    path: "apps/desktop/src-tauri/schemas/local-data-snapshot.schema.json",
    schema: localDataSnapshotSchema
  },
  {
    path: "apps/desktop/src-tauri/schemas/reset-local-data-result.schema.json",
    schema: resetLocalDataResultNativeCompatibilitySchema
  }
] as const;

let failed = false;

for (const output of outputs) {
  const absolutePath = resolve(root, output.path);
  const jsonSchema = z.toJSONSchema(output.schema, {
    target: "draft-7"
  });
  const expected = await format(JSON.stringify(jsonSchema), {
    ...prettierConfig,
    filepath: absolutePath
  });

  if (checkOnly) {
    const actual = existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : undefined;
    if (actual !== expected) {
      console.error(`Native JSON Schema is stale or missing: ${output.path}`);
      failed = true;
    } else {
      console.log(`Native JSON Schema is current: ${output.path}`);
    }
    continue;
  }

  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, expected, "utf8");
  console.log(`Generated ${output.path}`);
}

if (failed) {
  console.error("Run npm run generate:native-schemas and commit the generated contracts.");
  process.exit(1);
}
