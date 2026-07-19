import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { AppSettings } from "@platform/domain";

import { TauriSettingsRepository } from "../../infrastructure/persistence";
import { publishActivity } from "../../modules/history";
import { createDefaultAppSettings, validateAppSettings } from "../../modules/settings/application";
import { resolveTheme, SettingsSaveCoordinator } from "../../modules/settings/state";
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
  const [saveCoordinator] = useState(() => new SettingsSaveCoordinator(createDefaultAppSettings()));
  const [settings, setSettings] = useState<AppSettings>(() => saveCoordinator.current);
  const [status, setStatus] = useState<SettingsStatus>("loading");
  const [error, setError] = useState<string | undefined>();

  const refreshSettings = useCallback(async () => {
    setStatus("loading");
    setError(undefined);

    try {
      await saveCoordinator.whenIdle();
      const stored = await repository.getSettings();
      const resolved = stored ?? createDefaultAppSettings();
      const confirmed = stored === undefined ? await repository.saveSettings(resolved) : resolved;
      saveCoordinator.replace(confirmed);
      setSettings(confirmed);
      setStatus("ready");
      return confirmed;
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Application settings could not be loaded.";
      setError(message);
      setStatus("error");
      throw cause;
    }
  }, [repository, saveCoordinator]);

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

  const updateSettings = useCallback<SettingsContextValue["updateSettings"]>(
    (update) => {
      try {
        const attempt = saveCoordinator.schedule(
          (current) => validateAppSettings(update(current)),
          (next) => repository.saveSettings(next)
        );
        setSettings(attempt.optimistic);
        setStatus("saving");
        setError(undefined);

        const operation = attempt.completion.then((outcome) => {
          if (outcome.status === "saved") {
            if (outcome.latest) {
              setSettings(outcome.saved);
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

            return outcome.saved;
          }

          const message =
            outcome.cause instanceof Error
              ? outcome.cause.message
              : "Application settings could not be saved.";

          if (outcome.latest) {
            setSettings(outcome.rollback);
            setError(message);
            setStatus("error");
          }

          throw outcome.cause;
        });

        void operation.catch(() => undefined);
        return operation;
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "Application settings could not be saved.";
        setError(message);
        setStatus("error");
        const operation = Promise.reject<AppSettings>(cause);
        void operation.catch(() => undefined);
        return operation;
      }
    },
    [repository, saveCoordinator]
  );

  const resetSettings = useCallback(
    () => updateSettings(() => createDefaultAppSettings()),
    [updateSettings]
  );

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
