import type { PropsWithChildren } from "react";

import { ActivityProvider } from "./ActivityProvider";
import { BackupProvider } from "./BackupProvider";
import { InstructionPreferencesProvider } from "./InstructionPreferencesProvider";
import { SettingsProvider } from "./SettingsProvider";
import { ToastProvider } from "./ToastProvider";
import { UndoProvider } from "./UndoProvider";
import { VocabularyMetadataProvider } from "./VocabularyMetadataProvider";
import { VocabularyRepositoryProvider } from "./VocabularyRepositoryProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ActivityProvider>
      <ToastProvider>
      <UndoProvider>
        <SettingsProvider>
          <VocabularyRepositoryProvider>
            <VocabularyMetadataProvider>
              <BackupProvider>
                <InstructionPreferencesProvider>{children}</InstructionPreferencesProvider>
              </BackupProvider>
            </VocabularyMetadataProvider>
          </VocabularyRepositoryProvider>
        </SettingsProvider>
      </UndoProvider>
      </ToastProvider>
    </ActivityProvider>
  );
}
