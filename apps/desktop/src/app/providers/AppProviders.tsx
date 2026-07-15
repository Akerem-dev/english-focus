import type { PropsWithChildren } from "react";

import { BackupProvider } from "./BackupProvider";
import { InstructionPreferencesProvider } from "./InstructionPreferencesProvider";
import { SettingsProvider } from "./SettingsProvider";
import { VocabularyMetadataProvider } from "./VocabularyMetadataProvider";
import { VocabularyRepositoryProvider } from "./VocabularyRepositoryProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SettingsProvider>
      <VocabularyRepositoryProvider>
        <VocabularyMetadataProvider>
          <BackupProvider>
            <InstructionPreferencesProvider>{children}</InstructionPreferencesProvider>
          </BackupProvider>
        </VocabularyMetadataProvider>
      </VocabularyRepositoryProvider>
    </SettingsProvider>
  );
}
