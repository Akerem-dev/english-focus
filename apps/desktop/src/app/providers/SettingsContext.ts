import { createContext } from "react";
import type { AppSettings } from "@platform/domain";

export type SettingsStatus = "loading" | "ready" | "saving" | "saved" | "error";

export interface SettingsContextValue {
  readonly settings: AppSettings;
  readonly status: SettingsStatus;
  readonly error?: string | undefined;
  readonly updateSettings: (update: (current: AppSettings) => AppSettings) => Promise<AppSettings>;
  readonly resetSettings: () => Promise<AppSettings>;
  readonly refreshSettings: () => Promise<AppSettings>;
}

export const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);
