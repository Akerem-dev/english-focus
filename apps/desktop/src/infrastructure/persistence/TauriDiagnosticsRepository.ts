import { invoke } from "@tauri-apps/api/core";
import type {
  DiagnosticReport,
  DiagnosticsRepository,
  SafeMaintenanceResult
} from "@platform/domain";
import { diagnosticReportSchema, safeMaintenanceResultSchema } from "@platform/schemas";

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
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

    const payload = await invoke<unknown>("run_diagnostics", {
      generatedAt: new Date().toISOString()
    });
    return Object.freeze(diagnosticReportSchema.parse(payload));
  }

  async runSafeMaintenance(completedAt: string): Promise<SafeMaintenanceResult> {
    if (!isTauriRuntime()) {
      throw new Error("Safe maintenance is available only in the English Focus desktop app.");
    }

    const payload = await invoke<unknown>("run_safe_maintenance", { completedAt });
    return Object.freeze(safeMaintenanceResultSchema.parse(payload));
  }
}
