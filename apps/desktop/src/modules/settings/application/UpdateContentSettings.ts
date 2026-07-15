import type { AppSettings, ContentSettings } from "@platform/domain";

export function updateContentSettings(
  current: AppSettings,
  content: ContentSettings,
  updatedAt = new Date().toISOString()
): AppSettings {
  return Object.freeze({ ...current, content: Object.freeze(content), updatedAt });
}
