import { useEffect, useEffectEvent, useMemo, useState } from "react";
import type {
  SaveVocabularyEntryInput,
  StoredVocabularyEntry,
  VocabularyEntry,
  VocabularyStorageLayer
} from "@platform/domain";

import { Button, Modal } from "../../../components";
import { AppIcon } from "../../../design-system";
import { prepareVocabularyEntryEdit, type VocabularyEntryEditIssue } from "../application";
import { VocabularyEntryEditorContentSections } from "./VocabularyEntryEditorContentSections";
import { VocabularyEntryEditorIdentitySections } from "./VocabularyEntryEditorIdentitySections";
import { VocabularyEntryEditorLanguageSections } from "./VocabularyEntryEditorLanguageSections";

interface VocabularyEntryEditorDialogProps {
  readonly entry: VocabularyEntry;
  readonly layer: VocabularyStorageLayer;
  readonly open: boolean;
  readonly saving: boolean;
  readonly onClose: () => void;
  readonly onSave: (input: SaveVocabularyEntryInput) => Promise<StoredVocabularyEntry>;
}

export function VocabularyEntryEditorDialog({
  entry,
  layer,
  onClose,
  onSave,
  open,
  saving
}: VocabularyEntryEditorDialogProps) {
  const [draft, setDraft] = useState<VocabularyEntry>(() => structuredClone(entry));
  const [issues, setIssues] = useState<readonly VocabularyEntryEditIssue[]>([]);
  const [saveError, setSaveError] = useState<string | undefined>();

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(entry), [draft, entry]);

  function requestClose() {
    if (saving) {
      return;
    }

    if (dirty && !window.confirm("Discard the unsaved vocabulary changes in this editor?")) {
      return;
    }

    onClose();
  }

  useEffect(() => {
    if (!open || !dirty) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty, open]);

  async function save() {
    const prepared = prepareVocabularyEntryEdit({
      original: entry,
      draft,
      layer,
      updatedAt: new Date().toISOString()
    });

    if (prepared.kind === "failure") {
      setIssues(prepared.issues);
      setSaveError(prepared.message);
      return;
    }

    try {
      setIssues([]);
      setSaveError(undefined);
      await onSave(prepared.input);
      onClose();
    } catch (cause) {
      setSaveError(
        cause instanceof Error ? cause.message : "The vocabulary entry could not be saved locally."
      );
    }
  }

  const saveFromShortcut = useEffectEvent(save);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleSaveShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase("en-US") === "s") {
        event.preventDefault();
        event.stopPropagation();
        void saveFromShortcut();
      }
    }

    document.addEventListener("keydown", handleSaveShortcut, true);
    return () => document.removeEventListener("keydown", handleSaveShortcut, true);
  }, [open]);

  return (
    <Modal
      closeLabel="Close vocabulary editor"
      description={`Edit the essential learning content for “${entry.word}” without replacing JSON manually.`}
      footer={
        <>
          <Button disabled={saving} onClick={requestClose} variant="ghost">
            Cancel
          </Button>
          <Button
            disabled={!dirty}
            isLoading={saving}
            leadingIcon={<AppIcon name="check" size={16} />}
            onClick={() => void save()}
            variant="primary"
          >
            Save entry
          </Button>
        </>
      }
      onClose={requestClose}
      open={open}
      size="large"
      title="Edit vocabulary entry"
    >
      <div className="vocabulary-entry-editor">
        {saveError === undefined ? null : (
          <section className="vocabulary-entry-editor__error" role="alert">
            <strong>Entry needs attention</strong>
            <p>{saveError}</p>
            <ul>
              {issues.slice(0, 8).map((issue) => (
                <li key={`${issue.path}-${issue.message}`}>
                  <code>{issue.path || "entry"}</code>: {issue.message}
                </li>
              ))}
            </ul>
          </section>
        )}

        <VocabularyEntryEditorIdentitySections
          draft={draft}
          issues={issues}
          original={entry}
          setDraft={setDraft}
        />
        <VocabularyEntryEditorLanguageSections draft={draft} issues={issues} setDraft={setDraft} />
        <VocabularyEntryEditorContentSections draft={draft} issues={issues} setDraft={setDraft} />

        <p className="vocabulary-entry-editor__shortcut">
          Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>S</kbd> to validate and save.
        </p>
      </div>
    </Modal>
  );
}
