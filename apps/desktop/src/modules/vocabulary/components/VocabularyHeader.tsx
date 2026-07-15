import type { VocabularyEntry } from "@platform/domain";

import { Button, StatusBadge, TagChip } from "../../../components";
import { presentVocabularyEntry } from "../presenters/VocabularyEntryPresenter";

interface VocabularyHeaderProps {
  readonly entry: VocabularyEntry;
  readonly onBack: () => void;
}

export function VocabularyHeader({ entry, onBack }: VocabularyHeaderProps) {
  const presentation = presentVocabularyEntry(entry);

  return (
    <header className="vocabulary-detail-header">
      <Button className="vocabulary-detail-header__back" onClick={onBack} variant="ghost">
        ← Back to vocabulary
      </Button>

      <div className="vocabulary-detail-header__title-row">
        <div>
          <p className="route-page__eyebrow">Read-only core vocabulary</p>
          <h1 className="word-title">{entry.word}</h1>
          <p className="vocabulary-detail-header__translation">{presentation.primaryTranslation}</p>
        </div>
        <div className="vocabulary-detail-header__source">
          <StatusBadge tone="success">{presentation.reviewLabel}</StatusBadge>
          <span>{presentation.sourceLabel}</span>
        </div>
      </div>

      <div className="vocabulary-detail-header__metadata" aria-label="Vocabulary metadata">
        <StatusBadge tone="accent">CEFR {entry.cefr}</StatusBadge>
        <StatusBadge>{presentation.partOfSpeechLabel}</StatusBadge>
        {presentation.registerLabels.map((register) => (
          <TagChip key={register}>{register}</TagChip>
        ))}
      </div>
    </header>
  );
}
