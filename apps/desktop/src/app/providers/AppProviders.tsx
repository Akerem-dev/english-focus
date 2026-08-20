import type { PropsWithChildren } from "react";

import { ActivityProvider } from "./ActivityProvider";
import { AssistantProvider } from "./AssistantProvider";
import { BackupProvider } from "./BackupProvider";
import { ClipboardProvider } from "./ClipboardProvider";
import { FileTransferProvider } from "./FileTransferProvider";
import { GrammarProvider } from "./GrammarProvider";
import { InstructionPreferencesProvider } from "./InstructionPreferencesProvider";
import { MaintenanceProvider } from "./MaintenanceProvider";
import { SettingsProvider } from "./SettingsProvider";
import { ToastProvider } from "./ToastProvider";
import { UndoProvider } from "./UndoProvider";
import { VocabularyMetadataProvider } from "./VocabularyMetadataProvider";
import { VocabularyRepositoryProvider } from "./VocabularyRepositoryProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ActivityProvider>
      <ToastProvider>
        <ClipboardProvider>
          <FileTransferProvider>
            <MaintenanceProvider>
              <UndoProvider>
                <SettingsProvider>
                  <VocabularyRepositoryProvider>
                    <VocabularyMetadataProvider>
                      <BackupProvider>
                        <InstructionPreferencesProvider>
                          <AssistantProvider>
                            <GrammarProvider>{children}</GrammarProvider>
                          </AssistantProvider>
                        </InstructionPreferencesProvider>
                      </BackupProvider>
                    </VocabularyMetadataProvider>
                  </VocabularyRepositoryProvider>
                </SettingsProvider>
              </UndoProvider>
            </MaintenanceProvider>
          </FileTransferProvider>
        </ClipboardProvider>
      </ToastProvider>
    </ActivityProvider>
  );
}
