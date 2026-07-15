import { createContext, type Dispatch, type SetStateAction } from "react";
import type { InstructionPreferences } from "@platform/domain";

export interface InstructionPreferencesContextValue {
  readonly preferences: InstructionPreferences;
  readonly setPreferences: Dispatch<SetStateAction<InstructionPreferences>>;
  readonly resetPreferences: () => void;
}

export const InstructionPreferencesContext = createContext<
  InstructionPreferencesContextValue | undefined
>(undefined);
