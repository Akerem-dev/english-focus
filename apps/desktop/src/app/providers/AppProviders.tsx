import type { PropsWithChildren } from "react";

import { InstructionPreferencesProvider } from "./InstructionPreferencesProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return <InstructionPreferencesProvider>{children}</InstructionPreferencesProvider>;
}
