import { invoke } from "@tauri-apps/api/core";
import type { AppSettings, SettingsRepository } from "@platform/domain";
import { appSettingsInputSchema, appSettingsSchema } from "@platform/schemas";

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function parseStoredSettings(payload: unknown): AppSettings {
  return Object.freeze(appSettingsInputSchema.parse(payload));
}

function parseCanonicalSettings(payload: unknown): AppSettings {
  return Object.freeze(appSettingsSchema.parse(payload));
}

export class TauriSettingsRepository implements SettingsRepository {
  async getSettings(): Promise<AppSettings | undefined> {
    if (!isTauriRuntime()) {
      return undefined;
    }

    const payload = await invoke<unknown | null>("contract_get_app_settings");
    return payload === null ? undefined : parseStoredSettings(payload);
  }

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    const validated = parseCanonicalSettings(settings);

    if (!isTauriRuntime()) {
      return validated;
    }

    const payload = await invoke<unknown>("contract_save_app_settings", {
      settings: validated
    });
    return parseStoredSettings(payload);
  }
}
