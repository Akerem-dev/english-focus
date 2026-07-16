import { useContext } from "react";

import type {
  DiagnosticReport,
  DiagnosticsRepository,
  LocalDataRepository,
  LocalDataSnapshot,
  ResetLocalDataResult,
  SafeMaintenanceResult
} from "@platform/domain";

import { MaintenanceContext, type MaintenanceContextValue } from "./MaintenanceContext";

function unavailable(): never {
  throw new Error("MaintenanceProvider is not mounted.");
}

const MISSING_DIAGNOSTICS: DiagnosticsRepository = Object.freeze({
  runDiagnostics: async (): Promise<DiagnosticReport> => unavailable(),
  runSafeMaintenance: async (): Promise<SafeMaintenanceResult> => unavailable()
});

const MISSING_LOCAL_DATA: LocalDataRepository = Object.freeze({
  getSnapshot: async (): Promise<LocalDataSnapshot> => unavailable(),
  resetLocalData: async (): Promise<ResetLocalDataResult> => unavailable()
});

const MISSING_MAINTENANCE: MaintenanceContextValue = Object.freeze({
  diagnosticsRepository: MISSING_DIAGNOSTICS,
  localDataRepository: MISSING_LOCAL_DATA
});

export function useMaintenance(): MaintenanceContextValue {
  return useContext(MaintenanceContext) ?? MISSING_MAINTENANCE;
}
