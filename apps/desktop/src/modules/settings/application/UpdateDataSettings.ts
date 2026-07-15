import type { AppSettings, DataSettings } from "@platform/domain";

export function updateDataSettings(
  current: AppSettings,
  data: DataSettings,
  updatedAt = new Date().toISOString()
): AppSettings {
  return Object.freeze({ ...current, data: Object.freeze(data), updatedAt });
}
