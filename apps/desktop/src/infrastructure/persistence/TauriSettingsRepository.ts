import { invoke } from "@tauri-apps/api/core";
import type { AppSettings, SettingsRepository } from "@platform/domain";
import { appSettingsSchema } from "@platform/schemas";

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function parseSettings(payload: unknown): AppSettings {
  return Object.freeze(appSettingsSchema.parse(payload));
}

export class TauriSettingsRepository implements SettingsRepository {
  async getSettings(): Promise<AppSettings | undefined> {
    if (!isTauriRuntime()) {
      return undefined;
    }

    const payload = await invoke<unknown | null>("get_app_settings");
    return payload === null ? undefined : parseSettings(payload);
  }

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    const validated = parseSettings(settings);

    if (!isTauriRuntime()) {
      return validated;
    }

    const payload = await invoke<unknown>("save_app_settings", {
      settings: validated
    });
    return parseSettings(payload);
  }
}
