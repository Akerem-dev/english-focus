import { invoke } from "@tauri-apps/api/core";
import type {
  DiagnosticReport,
  DiagnosticsRepository,
  SafeMaintenanceResult
} from "@platform/domain";
import { diagnosticReportSchema, safeMaintenanceResultSchema } from "@platform/schemas";

export interface DiagnosticScanCoverage {
  readonly complete: boolean;
  readonly issues: readonly string[];
}

const COVERAGE_RECOMMENDATION =
  "Close and reopen English Focus, then check app health again. If the problem remains, validate a recent backup before changing local data.";

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function parseDiagnosticScanCoverage(payload: unknown): DiagnosticScanCoverage {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Diagnostic coverage response is invalid.");
  }

  const candidate = payload as { complete?: unknown; issues?: unknown };
  if (
    typeof candidate.complete !== "boolean" ||
    !Array.isArray(candidate.issues) ||
    !candidate.issues.every((issue) => typeof issue === "string" && issue.trim().length > 0)
  ) {
    throw new Error("Diagnostic coverage response is invalid.");
  }

  return Object.freeze({
    complete: candidate.complete,
    issues: Object.freeze([...candidate.issues])
  });
}

async function loadDiagnosticScanCoverage(): Promise<DiagnosticScanCoverage> {
  try {
    const payload = await invoke<unknown>("check_diagnostic_scan_coverage");
    return parseDiagnosticScanCoverage(payload);
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

export function applyDiagnosticScanCoverage(
  report: DiagnosticReport,
  coverage: DiagnosticScanCoverage
): DiagnosticReport {
  if (coverage.complete) {
    return report;
  }

  const details =
    coverage.issues.length === 0
      ? Object.freeze(["One or more local data checks did not finish."])
      : Object.freeze([...coverage.issues]);
  const coverageCheck = Object.freeze({
    id: "diagnostic-coverage",
    title: "Diagnostic coverage",
    status: "failed" as const,
    summary: "One or more local data checks could not be completed.",
    details,
    repairable: false
  });

  return Object.freeze({
    ...report,
    overallStatus: "critical",
    checks: Object.freeze([
      ...report.checks.filter((check) => check.id !== coverageCheck.id),
      coverageCheck
    ]),
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
