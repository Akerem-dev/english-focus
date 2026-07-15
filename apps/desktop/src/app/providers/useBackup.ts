import { useContext } from "react";

import { BackupContext } from "./BackupContext";

export function useBackup() {
  const context = useContext(BackupContext);

  if (context === undefined) {
    throw new Error("useBackup must be used inside BackupProvider.");
  }

  return context;
}
