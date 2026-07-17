import type { VocabularyEntry, VocabularyUserMetadata } from "@platform/domain";

import { Button, CefrBadge, StatusBadge, TagChip } from "../../../components";
import { AppIcon } from "../../../design-system";
import { presentVocabularyEntry } from "../presenters/VocabularyEntryPresenter";

interface VocabularyHeaderProps {
  readonly entry: VocabularyEntry;
  readonly metadata?: VocabularyUserMetadata | undefined;
  readonly onBack: () => void;
  readonly onEditEntry: () => void;
  readonly onEditMetadata: () => void;
  readonly onImportReplacement: () => void;
  readonly onExport: () => void;
}

export function VocabularyHeader({
  entry,
  metadata,
  onBack,
  onEditEntry,
  onEditMetadata,
  onExport,
  onImportReplacement
}: VocabularyHeaderProps) {
  const presentation = presentVocabularyEntry(entry);

  return (
    <header className="vocabulary-detail-header">
      <Button className="vocabulary-detail-header__back" onClick={onBack} variant="ghost">
        ← Back to vocabulary
      </Button>

      <div className="vocabulary-detail-header__title-row">
        <div>
          <p className="route-page__eyebrow">Local vocabulary entry</p>
          <h1 className="word-title">{entry.word}</h1>
          <p className="vocabulary-detail-header__translation">{presentation.primaryTranslation}</p>
        </div>
        <div className="vocabulary-detail-header__source">
          <span>{presentation.sourceLabel}</span>
          <div className="vocabulary-detail-header__actions">
            <Button
              leadingIcon={<AppIcon name="settings" size={16} />}
              onClick={onEditEntry}
              size="small"
              variant="primary"
            >
              Edit entry
            </Button>
            <Button
              leadingIcon={<AppIcon name="star" size={16} />}
              onClick={onEditMetadata}
              size="small"
              variant={metadata?.favorite === true ? "primary" : "secondary"}
            >
              {metadata?.favorite === true ? "Favorited" : "Personal details"}
            </Button>
            <Button
              leadingIcon={<AppIcon name="download" size={16} />}
              onClick={onExport}
              size="small"
              variant="secondary"
            >
              Export JSON
            </Button>
            <Button onClick={onImportReplacement} size="small" variant="ghost">
              Import JSON
            </Button>
          </div>
        </div>
      </div>

      <div className="vocabulary-detail-header__metadata" aria-label="Vocabulary metadata">
        <CefrBadge level={entry.cefr} />
        <StatusBadge>{presentation.partOfSpeechLabel}</StatusBadge>
        {presentation.registerLabels.map((register) => (
          <TagChip key={register}>{register}</TagChip>
        ))}
        {metadata?.tags.slice(0, 4).map((tag) => (
          <TagChip key={tag.id}>{tag.name}</TagChip>
        ))}
      </div>
    </header>
  );
}
