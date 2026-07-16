import type { PropsWithChildren } from "react";

import { ActivityProvider } from "./ActivityProvider";
import { BackupProvider } from "./BackupProvider";
import { ClipboardProvider } from "./ClipboardProvider";
import { FileTransferProvider } from "./FileTransferProvider";
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
                        <InstructionPreferencesProvider>{children}</InstructionPreferencesProvider>
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
