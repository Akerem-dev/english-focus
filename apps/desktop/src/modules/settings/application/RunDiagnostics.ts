import type {
  DiagnosticCheck,
  DiagnosticReport,
  DiagnosticsRepository,
  SafeMaintenanceResult
} from "@platform/domain";

export function runDiagnostics(repository: DiagnosticsRepository): Promise<DiagnosticReport> {
  return repository.runDiagnostics();
}

export function runSafeMaintenance(
  repository: DiagnosticsRepository,
  completedAt = new Date().toISOString()
): Promise<SafeMaintenanceResult> {
  return repository.runSafeMaintenance(completedAt);
}

function checkLine(check: DiagnosticCheck): string {
  const details = check.details.length === 0 ? "" : `\n  ${check.details.join("\n  ")}`;
  return `[${check.status.toUpperCase()}] ${check.title}: ${check.summary}${details}`;
}

export function createDiagnosticSummary(report: DiagnosticReport): string {
  return [
    "English Focus local diagnostics",
    `Generated: ${report.generatedAt}`,
    `Application version: ${report.appVersion}`,
    `Database schema: ${report.databaseSchemaVersion}`,
    `Overall status: ${report.overallStatus}`,
    "",
    "Counts",
    `- Vocabulary entries: ${report.counts.vocabularyEntries}`,
    `- Study metadata: ${report.counts.vocabularyMetadata}`,
    `- Settings records: ${report.counts.settingsRecords}`,
    `- Retained backups: ${report.counts.retainedBackups}`,
    `- Invalid vocabulary JSON: ${report.counts.invalidVocabularyJson}`,
    `- Invalid metadata JSON: ${report.counts.invalidMetadataJson}`,
    `- Invalid settings JSON: ${report.counts.invalidSettingsJson}`,
    `- Normalized-word mismatches: ${report.counts.normalizedWordMismatches}`,
    "",
    "Checks",
    ...report.checks.map(checkLine),
    "",
    "Recommendations",
    ...(report.recommendations.length === 0
      ? ["- No action is required."]
      : report.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}
