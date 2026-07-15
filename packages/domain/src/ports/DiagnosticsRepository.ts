import type { DiagnosticReport, SafeMaintenanceResult } from "../diagnostics";

export interface DiagnosticsRepository {
  runDiagnostics(): Promise<DiagnosticReport>;
  runSafeMaintenance(completedAt: string): Promise<SafeMaintenanceResult>;
}
