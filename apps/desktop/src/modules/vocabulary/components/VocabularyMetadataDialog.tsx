import { useEffect, useEffectEvent, useMemo, useState } from "react";
import type {
  SaveVocabularyUserMetadataInput,
  VocabularyEntry,
  VocabularyUserMetadata
} from "@platform/domain";

import { Button, Modal, StatusBadge, TextAreaField, TextField } from "../../../components";
import { AppIcon } from "../../../design-system";
import { createVocabularyUserMetadata, parseVocabularyTags } from "../application";

interface VocabularyMetadataDialogProps {
  readonly entry: VocabularyEntry;
  readonly metadata?: VocabularyUserMetadata | undefined;
  readonly open: boolean;
  readonly saving: boolean;
  readonly onClose: () => void;
  readonly onSave: (input: SaveVocabularyUserMetadataInput) => Promise<void>;
}

function formatDate(value: string | undefined): string {
  if (value === undefined) {
    return "Not viewed yet";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-GB", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
}

export function VocabularyMetadataDialog({
  entry,
  metadata,
  onClose,
  onSave,
  open,
  saving
}: VocabularyMetadataDialogProps) {
  const initialMetadata = useMemo(
    () => metadata ?? createVocabularyUserMetadata(entry.normalizedWord, new Date().toISOString()),
    [entry.normalizedWord, metadata]
  );
  const [favorite, setFavorite] = useState(initialMetadata.favorite);
  const [tagsInput, setTagsInput] = useState(
    initialMetadata.tags.map((tag) => tag.name).join(", ")
  );
  const [note, setNote] = useState(initialMetadata.note);
  const [error, setError] = useState<string | undefined>();

  async function save() {
    const updatedAt = new Date().toISOString();

    try {
      const tags = parseVocabularyTags(tagsInput, updatedAt);
      setError(undefined);
      await onSave({
        normalizedWord: entry.normalizedWord,
        favorite,
        tags,
        note,
        learningStatus: initialMetadata.learningStatus,
        reviewStatus: initialMetadata.reviewStatus,
        lastViewedAt: initialMetadata.lastViewedAt,
        viewCount: initialMetadata.viewCount,
        createdAt: initialMetadata.createdAt,
        updatedAt
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Personal details could not be saved.");
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

        if (!saving) {
          void saveFromShortcut();
        }
      }
    }

    document.addEventListener("keydown", handleSaveShortcut, true);

    return () => {
      document.removeEventListener("keydown", handleSaveShortcut, true);
    };
  }, [open, saving]);

  return (
    <Modal
      description={`Personal notes, tags, and favorites for “${entry.word}” are stored separately from vocabulary content.`}
      footer={
        <>
          <Button disabled={saving} onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button
            isLoading={saving}
            leadingIcon={<AppIcon name="check" size={16} />}
            onClick={() => {
              void save();
            }}
            variant="primary"
          >
            Save personal details
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="large"
      title="Edit personal details"
    >
      <div className="vocabulary-metadata-dialog">
        <section className="vocabulary-metadata-dialog__summary">
          <div>
            <p className="route-page__eyebrow">Local personal details</p>
            <h3>{entry.word}</h3>
            <p>{entry.meanings[0]?.translationsTr.slice(0, 3).join(", ")}</p>
          </div>
          <button
            aria-pressed={favorite}
            className="vocabulary-metadata-dialog__favorite"
            data-active={favorite || undefined}
            onClick={() => {
              setFavorite((current) => !current);
            }}
            type="button"
          >
            <AppIcon name="star" size={20} />
            <span>{favorite ? "Favorited" : "Add to favorites"}</span>
          </button>
        </section>

        {error === undefined ? null : (
          <div className="vocabulary-metadata-dialog__error" role="alert">
            <strong>Personal details need attention</strong>
            <p>{error}</p>
          </div>
        )}

        <div className="vocabulary-metadata-dialog__fields">
          <TextField
            helperText="Separate tags with commas. Duplicates are removed locally."
            label="Tags"
            maxLength={1_500}
            onChange={(event) => {
              setTagsInput(event.currentTarget.value);
            }}
            placeholder="IELTS, academic, writing"
            value={tagsInput}
          />
          <TextAreaField
            helperText={`${note.length.toLocaleString()} / 5,000 characters`}
            label="Personal note"
            maxLength={5_000}
            onChange={(event) => {
              setNote(event.currentTarget.value);
            }}
            placeholder="Add a private usage reminder, contrast, or study note."
            rows={6}
            value={note}
          />
        </div>

        <section className="vocabulary-metadata-dialog__activity" aria-label="Vocabulary activity">
          <div>
            <span>Views</span>
            <strong>{initialMetadata.viewCount}</strong>
          </div>
          <div>
            <span>Last viewed</span>
            <strong>{formatDate(initialMetadata.lastViewedAt)}</strong>
          </div>
          <div>
            <span>Storage</span>
            <StatusBadge tone="success">SQLite · local only</StatusBadge>
          </div>
        </section>
      </div>
    </Modal>
  );
}
