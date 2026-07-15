import { useMemo, useState, type PropsWithChildren } from "react";
import type { InstructionPreferences } from "@platform/domain";

import {
  createDefaultInstructionPreferences,
  validateInstructionPreferences
} from "../../modules/instruction/services";
import { updateInstructionSettings } from "../../modules/settings/application";
import {
  InstructionPreferencesContext,
  type InstructionPreferencesContextValue
} from "./InstructionPreferencesContext";
import { useOptionalSettings } from "./useOptionalSettings";

export function InstructionPreferencesProvider({ children }: PropsWithChildren) {
  const settingsContext = useOptionalSettings();
  const [fallbackPreferences, setFallbackPreferences] = useState<InstructionPreferences>(() =>
    createDefaultInstructionPreferences()
  );
  const preferences = settingsContext?.settings.instruction ?? fallbackPreferences;

  const value = useMemo<InstructionPreferencesContextValue>(
    () => ({
      preferences,
      setPreferences(update) {
        if (settingsContext === undefined) {
          setFallbackPreferences((current) => {
            const next = typeof update === "function" ? update(current) : update;
            return validateInstructionPreferences(next);
          });
          return;
        }

        void settingsContext.updateSettings((current) => {
          const next =
            typeof update === "function" ? update(current.instruction) : update;
          return updateInstructionSettings(current, validateInstructionPreferences(next));
        });
      },
      resetPreferences() {
        const defaults = createDefaultInstructionPreferences();

        if (settingsContext === undefined) {
          setFallbackPreferences(defaults);
          return;
        }

        void settingsContext.updateSettings((current) =>
          updateInstructionSettings(current, defaults)
        );
      }
    }),
    [preferences, settingsContext]
  );

  return (
    <InstructionPreferencesContext.Provider value={value}>
      {children}
    </InstructionPreferencesContext.Provider>
  );
}
