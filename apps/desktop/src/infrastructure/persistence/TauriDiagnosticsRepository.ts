import { invoke } from "@tauri-apps/api/core";
import type {
  DiagnosticReport,
  DiagnosticsRepository,
  SafeMaintenanceResult
} from "@platform/domain";
import {
  diagnosticReportSchema,
  diagnosticScanCoverageSchema,
  safeMaintenanceResultSchema
} from "@platform/schemas";

interface DiagnosticScanCoverage {
  readonly complete: boolean;
  readonly issues: readonly string[];
}

const COVERAGE_RECOMMENDATION =
  "Close and reopen English Focus, then check app health again. If the problem remains, validate a recent backup before changing local data.";

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function loadDiagnosticScanCoverage(): Promise<DiagnosticScanCoverage> {
  try {
    const payload = await invoke<unknown>("check_diagnostic_scan_coverage");
    return Object.freeze(diagnosticScanCoverageSchema.parse(payload));
  } catch {
    return Object.freeze({
      complete: false,
      issues: Object.freeze(["The diagnostic coverage check could not be completed."])
    });
  }
}

function keepActionableRecommendations(recommendations: readonly string[]): readonly string[] {
  const actionable = recommendations.filter(
    (recommendation) => !recommendation.toLowerCase().startsWith("no action is required")
  );

  return Object.freeze(
    actionable.includes(COVERAGE_RECOMMENDATION)
      ? actionable
      : [...actionable, COVERAGE_RECOMMENDATION]
  );
}

function friendlyCoverageIssue(issue: string): string {
  const normalized = issue.toLowerCase();

  if (normalized.startsWith("vocabulary records")) {
    return "Saved words could not be checked completely.";
  }

  if (normalized.startsWith("study details")) {
    return "Favorites, tags, and notes could not be checked completely.";
  }

  if (normalized.startsWith("app settings")) {
    return "Application preferences could not be checked completely.";
  }

  if (normalized.startsWith("recent activity")) {
    return "Recent activity could not be checked completely.";
  }

  if (normalized.startsWith("saved backups")) {
    return "Saved backups could not be checked completely.";
  }

  return "One or more local data checks did not finish.";
}

function friendlyCoverageIssues(issues: readonly string[]): readonly string[] {
  const friendly =
    issues.length === 0
      ? ["One or more local data checks did not finish."]
      : issues.map(friendlyCoverageIssue);
  return Object.freeze([...new Set(friendly)]);
}

function backupScanFailed(issues: readonly string[]): boolean {
  return issues.some((issue) => issue.toLowerCase().startsWith("saved backups"));
}

export function applyDiagnosticScanCoverage(
  report: DiagnosticReport,
  coverage: DiagnosticScanCoverage
): DiagnosticReport {
  if (coverage.complete) {
    return report;
  }

  const coverageCheck = Object.freeze({
    id: "diagnostic-coverage",
    title: "Diagnostic coverage",
    status: "failed" as const,
    summary: "One or more local data checks could not be completed.",
    details: friendlyCoverageIssues(coverage.issues),
    repairable: false
  });
  const backupUnavailable = backupScanFailed(coverage.issues);
  const checks = report.checks.filter(
    (check) =>
      check.id !== coverageCheck.id && (!backupUnavailable || check.id !== "backup-availability")
  );

  if (backupUnavailable) {
    checks.push(
      Object.freeze({
        id: "backup-availability",
        title: "Recovery readiness",
        status: "failed" as const,
        summary: "Saved backups could not be checked right now.",
        details: Object.freeze(["The backup folder was unavailable during this check."]),
        repairable: false
      })
    );
  }

  checks.push(coverageCheck);

  return Object.freeze({
    ...report,
    overallStatus: "critical",
    checks: Object.freeze(checks),
    recommendations: keepActionableRecommendations(report.recommendations)
  });
}

export class TauriDiagnosticsRepository implements DiagnosticsRepository {
  async runDiagnostics(): Promise<DiagnosticReport> {
    if (!isTauriRuntime()) {
      return Object.freeze({
        generatedAt: new Date().toISOString(),
        appVersion: "browser-preview",
        databaseSchemaVersion: "unavailable",
        overallStatus: "attention",
        checks: Object.freeze([
          Object.freeze({
            id: "desktop-runtime",
            title: "Desktop runtime",
            status: "warning",
            summary: "Native database diagnostics require the English Focus desktop app.",
            details: Object.freeze([]),
            repairable: false
          })
        ]),
        counts: Object.freeze({
          vocabularyEntries: 0,
          vocabularyMetadata: 0,
          settingsRecords: 0,
          retainedBackups: 0,
          invalidVocabularyJson: 0,
          invalidMetadataJson: 0,
          invalidSettingsJson: 0,
          normalizedWordMismatches: 0
        }),
        recommendations: Object.freeze(["Run diagnostics inside the native Tauri application."])
      });
    }

    const [payload, coverage] = await Promise.all([
      invoke<unknown>("run_diagnostics", {
        generatedAt: new Date().toISOString()
      }),
      loadDiagnosticScanCoverage()
    ]);
    const report = Object.freeze(diagnosticReportSchema.parse(payload));
    return applyDiagnosticScanCoverage(report, coverage);
  }

  async runSafeMaintenance(completedAt: string): Promise<SafeMaintenanceResult> {
    if (!isTauriRuntime()) {
      throw new Error("Safe maintenance is available only in the English Focus desktop app.");
    }

    const payload = await invoke<unknown>("run_safe_maintenance", { completedAt });
    const result = Object.freeze(safeMaintenanceResultSchema.parse(payload));
    const coverage = await loadDiagnosticScanCoverage();

    return Object.freeze({
      ...result,
      report: applyDiagnosticScanCoverage(result.report, coverage)
    });
  }
}
