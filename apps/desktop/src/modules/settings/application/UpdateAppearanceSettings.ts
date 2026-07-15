import type { AppSettings, AppearanceSettings } from "@platform/domain";

export function updateAppearanceSettings(
  current: AppSettings,
  appearance: AppearanceSettings,
  updatedAt = new Date().toISOString()
): AppSettings {
  return Object.freeze({ ...current, appearance: Object.freeze(appearance), updatedAt });
}
