import type { VocabularyEntry } from "@platform/domain";

import { Section, StatusBadge } from "../../../components";
import { formatPronunciationVariant } from "../presenters/VocabularyEntryPresenter";

interface PronunciationSectionProps {
  readonly entry: VocabularyEntry;
}

export function PronunciationSection({ entry }: PronunciationSectionProps) {
  return (
    <Section className="vocabulary-section" headingLevel={2} title="Pronunciation">
      <div className="pronunciation-list">
        {entry.pronunciations.map((pronunciation) => (
          <article
            className="pronunciation-item"
            key={`${pronunciation.variant}-${pronunciation.ipa}`}
          >
            <div>
              <StatusBadge>{formatPronunciationVariant(pronunciation.variant)}</StatusBadge>
              <strong>{pronunciation.ipa}</strong>
            </div>
            {pronunciation.syllableBreakdown === undefined ? null : (
              <p>{pronunciation.syllableBreakdown}</p>
            )}
            {pronunciation.stress === undefined ? null : <small>{pronunciation.stress}</small>}
          </article>
        ))}
      </div>
    </Section>
  );
}
