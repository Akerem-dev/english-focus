import { useContext } from "react";

import { SettingsContext } from "./SettingsContext";

export function useOptionalSettings() {
  return useContext(SettingsContext);
}
