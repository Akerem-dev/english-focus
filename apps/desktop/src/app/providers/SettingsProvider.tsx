import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import type { AppSettings } from "@platform/domain";

import { TauriSettingsRepository } from "../../infrastructure/persistence";
import { publishActivity } from "../../modules/history";
import { createDefaultAppSettings, validateAppSettings } from "../../modules/settings/application";
import { resolveTheme } from "../../modules/settings/state";
import { SettingsContext, type SettingsContextValue, type SettingsStatus } from "./SettingsContext";

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
  const settingsRef = useRef(settings);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const saveSequence = useRef(0);

  const refreshSettings = useCallback(async () => {
    setStatus("loading");
    setError(undefined);

    try {
      const stored = await repository.getSettings();
      const resolved = stored ?? createDefaultAppSettings();
      settingsRef.current = resolved;
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
    const timer = window.setTimeout(() => {
      void refreshSettings().catch(() => undefined);
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
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
      const previous = settingsRef.current;
      const next = validateAppSettings(update(previous));
      const sequence = saveSequence.current + 1;
      saveSequence.current = sequence;
      settingsRef.current = next;
      setSettings(next);
      setStatus("saving");
      setError(undefined);

      const saveOperation = saveQueue.current.then(() => repository.saveSettings(next));
      saveQueue.current = saveOperation.then(
        () => undefined,
        () => undefined
      );

      try {
        const saved = await saveOperation;

        if (saveSequence.current === sequence) {
          settingsRef.current = saved;
          setSettings(saved);
          setStatus("saved");
          publishActivity({
            kind: "settings-updated",
            scope: "settings",
            label: "Application settings updated"
          });
          window.setTimeout(() => {
            setStatus((current) => (current === "saved" ? "ready" : current));
          }, 1_200);
        }

        return saved;
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "Application settings could not be saved.";
        if (saveSequence.current === sequence) {
          settingsRef.current = previous;
          setSettings(previous);
          setError(message);
          setStatus("error");
        }
        throw cause;
      }
    },
    [repository]
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
