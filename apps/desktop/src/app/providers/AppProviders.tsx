import type { PropsWithChildren } from "react";

import { InstructionPreferencesProvider } from "./InstructionPreferencesProvider";
import { VocabularyRepositoryProvider } from "./VocabularyRepositoryProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <VocabularyRepositoryProvider>
      <InstructionPreferencesProvider>{children}</InstructionPreferencesProvider>
    </VocabularyRepositoryProvider>
  );
}
