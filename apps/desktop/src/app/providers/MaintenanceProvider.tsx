import { useMemo, type PropsWithChildren } from "react";

import type { DiagnosticsRepository, LocalDataRepository } from "@platform/domain";

import {
  TauriDiagnosticsRepository,
  TauriLocalDataRepository
} from "../../infrastructure/persistence";
import { MaintenanceContext, type MaintenanceContextValue } from "./MaintenanceContext";

interface MaintenanceProviderProps extends PropsWithChildren {
  readonly diagnosticsRepository?: DiagnosticsRepository;
  readonly localDataRepository?: LocalDataRepository;
}

export function MaintenanceProvider({
  children,
  diagnosticsRepository,
  localDataRepository
}: MaintenanceProviderProps) {
  const value = useMemo<MaintenanceContextValue>(
    () => ({
      diagnosticsRepository: diagnosticsRepository ?? new TauriDiagnosticsRepository(),
      localDataRepository: localDataRepository ?? new TauriLocalDataRepository()
    }),
    [diagnosticsRepository, localDataRepository]
  );

  return <MaintenanceContext.Provider value={value}>{children}</MaintenanceContext.Provider>;
}
