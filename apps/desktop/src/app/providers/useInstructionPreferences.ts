import { useContext } from "react";

import {
  InstructionPreferencesContext,
  type InstructionPreferencesContextValue
} from "./InstructionPreferencesContext";

export function useInstructionPreferences(): InstructionPreferencesContextValue {
  const value = useContext(InstructionPreferencesContext);

  if (value === undefined) {
    throw new Error(
      "useInstructionPreferences must be used inside InstructionPreferencesProvider."
    );
  }

  return value;
}
