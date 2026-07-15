import { useMemo, useState, type PropsWithChildren } from "react";
import type { InstructionPreferences } from "@platform/domain";

import {
  createDefaultInstructionPreferences,
  validateInstructionPreferences
} from "../../modules/instruction/services";
import {
  InstructionPreferencesContext,
  type InstructionPreferencesContextValue
} from "./InstructionPreferencesContext";

export function InstructionPreferencesProvider({ children }: PropsWithChildren) {
  const [preferences, setPreferencesState] = useState<InstructionPreferences>(() =>
    createDefaultInstructionPreferences()
  );

  const value = useMemo<InstructionPreferencesContextValue>(
    () => ({
      preferences,
      setPreferences(update) {
        setPreferencesState((current) => {
          const next = typeof update === "function" ? update(current) : update;
          return validateInstructionPreferences(next);
        });
      },
      resetPreferences() {
        setPreferencesState(createDefaultInstructionPreferences());
      }
    }),
    [preferences]
  );

  return (
    <InstructionPreferencesContext.Provider value={value}>
      {children}
    </InstructionPreferencesContext.Provider>
  );
}
