import type { AppSettings } from "../settings";

export interface SettingsRepository {
  getSettings(): Promise<AppSettings | undefined>;
  saveSettings(settings: AppSettings): Promise<AppSettings>;
}
