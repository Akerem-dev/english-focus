import type { PropsWithChildren } from "react";

import { InstructionPreferencesProvider } from "./InstructionPreferencesProvider";
import { SettingsProvider } from "./SettingsProvider";
import { VocabularyMetadataProvider } from "./VocabularyMetadataProvider";
import { VocabularyRepositoryProvider } from "./VocabularyRepositoryProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SettingsProvider>
      <VocabularyRepositoryProvider>
        <VocabularyMetadataProvider>
          <InstructionPreferencesProvider>{children}</InstructionPreferencesProvider>
        </VocabularyMetadataProvider>
      </VocabularyRepositoryProvider>
    </SettingsProvider>
  );
}
