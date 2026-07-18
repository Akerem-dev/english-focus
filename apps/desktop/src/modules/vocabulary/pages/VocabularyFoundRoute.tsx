import type {
  SaveVocabularyEntryInput,
  SaveVocabularyUserMetadataInput,
  StoredVocabularyEntry,
  VocabularyStorageLayer,
  VocabularyUserMetadata
} from "@platform/domain";

import { PasteGeneratedJsonDialog } from "../../import-export";
import type { VocabularySearchState } from "../../search/state";
import {
  VocabularyEntryEditorDialog,
  VocabularyFoundState,
  VocabularyMetadataDialog
} from "../components";

type FoundSearchState = Extract<VocabularySearchState, { kind: "found" }>;

interface VocabularyFoundRouteProps {
  readonly state: FoundSearchState;
  readonly metadata?: VocabularyUserMetadata | undefined;
  readonly backLabel: string;
  readonly editLayer: VocabularyStorageLayer;
  readonly editorOpen: boolean;
  readonly editorSaving: boolean;
  readonly metadataOpen: boolean;
  readonly metadataSaving: boolean;
  readonly importWord?: string | undefined;
  readonly onBack: () => void;
  readonly onOpenEditor: () => void;
  readonly onCloseEditor: () => void;
  readonly onSaveEntry: (input: SaveVocabularyEntryInput) => Promise<StoredVocabularyEntry>;
  readonly onOpenMetadata: () => void;
  readonly onCloseMetadata: () => void;
  readonly onSaveMetadata: (input: SaveVocabularyUserMetadataInput) => Promise<void>;
  readonly onExport: () => void;
  readonly onOpenImport: () => void;
  readonly onCloseImport: () => void;
  readonly onOpenSavedEntry: (word: string) => void;
}

export function VocabularyFoundRoute({
  backLabel,
  editLayer,
  editorOpen,
  editorSaving,
  importWord,
  metadata,
  metadataOpen,
  metadataSaving,
  onBack,
  onCloseEditor,
  onCloseImport,
  onCloseMetadata,
  onExport,
  onOpenEditor,
  onOpenImport,
  onOpenMetadata,
  onOpenSavedEntry,
  onSaveEntry,
  onSaveMetadata,
  state
}: VocabularyFoundRouteProps) {
  return (
    <>
      <VocabularyFoundState
        backLabel={backLabel}
        entry={state.entry}
        metadata={metadata}
        onBack={onBack}
        onEditEntry={onOpenEditor}
        onEditMetadata={onOpenMetadata}
        onExport={onExport}
        onImportReplacement={onOpenImport}
      />
      {editorOpen ? (
        <VocabularyEntryEditorDialog
          entry={state.entry}
          layer={editLayer}
          onClose={onCloseEditor}
          onSave={onSaveEntry}
          open
          saving={editorSaving}
        />
      ) : null}
      {metadataOpen ? (
        <VocabularyMetadataDialog
          entry={state.entry}
          metadata={metadata}
          onClose={onCloseMetadata}
          onSave={onSaveMetadata}
          open
          saving={metadataSaving}
        />
      ) : null}
      {importWord === undefined ? null : (
        <PasteGeneratedJsonDialog
          expectedWord={importWord}
          onClose={onCloseImport}
          onOpenSavedEntry={onOpenSavedEntry}
          open
        />
      )}
    </>
  );
}
