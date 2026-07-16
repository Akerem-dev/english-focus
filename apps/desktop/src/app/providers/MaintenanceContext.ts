import { createContext } from "react";

import type { DiagnosticsRepository, LocalDataRepository } from "@platform/domain";

export interface MaintenanceContextValue {
  readonly diagnosticsRepository: DiagnosticsRepository;
  readonly localDataRepository: LocalDataRepository;
}

export const MaintenanceContext = createContext<MaintenanceContextValue | undefined>(undefined);
