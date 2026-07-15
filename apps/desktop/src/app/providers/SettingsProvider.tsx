import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren
} from "react";
import type { AppSettings } from "@platform/domain";

import { TauriSettingsRepository } from "../../infrastructure/persistence";
import {
  createDefaultAppSettings,
  validateAppSettings
} from "../../modules/settings/application";
import { resolveTheme } from "../../modules/settings/state";
import {
  SettingsContext,
  type SettingsContextValue,
  type SettingsStatus
} from "./SettingsContext";

function applyDocumentPreferences(settings: AppSettings, systemPrefersDark: boolean): void {
  const resolvedTheme = resolveTheme(settings.appearance.theme, systemPrefersDark);
  const root = document.documentElement;
  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = settings.appearance.theme;
  root.dataset.reducedMotion = String(settings.appearance.reducedMotion);
  root.dataset.interfaceSize = settings.appearance.interfaceSize;
  root.style.colorScheme = resolvedTheme;
}

export function SettingsProvider({ children }: PropsWithChildren) {
  const repository = useMemo(() => new TauriSettingsRepository(), []);
  const [settings, setSettings] = useState<AppSettings>(() => createDefaultAppSettings());
  const [status, setStatus] = useState<SettingsStatus>("loading");
  const [error, setError] = useState<string | undefined>();
  const saveSequence = useRef(0);

  const refreshSettings = useCallback(async () => {
    setStatus("loading");
    setError(undefined);

    try {
      const stored = await repository.getSettings();
      const resolved = stored ?? createDefaultAppSettings();
      setSettings(resolved);

      if (stored === undefined) {
        await repository.saveSettings(resolved);
      }

      setStatus("ready");
      return resolved;
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Application settings could not be loaded.";
      setError(message);
      setStatus("error");
      throw cause;
    }
  }, [repository]);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      applyDocumentPreferences(settings, media.matches);
    };

    apply();
    media.addEventListener("change", apply);
    return () => {
      media.removeEventListener("change", apply);
    };
  }, [settings]);

  const updateSettings = useCallback(
    async (update: (current: AppSettings) => AppSettings) => {
      const next = validateAppSettings(update(settings));
      const sequence = saveSequence.current + 1;
      saveSequence.current = sequence;
      setSettings(next);
      setStatus("saving");
      setError(undefined);

      try {
        const saved = await repository.saveSettings(next);

        if (saveSequence.current === sequence) {
          setSettings(saved);
          setStatus("saved");
          window.setTimeout(() => {
            setStatus((current) => (current === "saved" ? "ready" : current));
          }, 1_200);
        }

        return saved;
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "Application settings could not be saved.";
        setError(message);
        setStatus("error");
        throw cause;
      }
    },
    [repository, settings]
  );

  const resetSettings = useCallback(async () => {
    const defaults = createDefaultAppSettings();
    return updateSettings(() => defaults);
  }, [updateSettings]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      status,
      error,
      updateSettings,
      resetSettings,
      refreshSettings
    }),
    [error, refreshSettings, resetSettings, settings, status, updateSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
