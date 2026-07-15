import type { VocabularyEntry } from "@platform/domain";

import { Section, StatusBadge } from "../../../components";
import { formatPartOfSpeech } from "../presenters/VocabularyEntryPresenter";

interface WordFamilySectionProps {
  readonly entry: VocabularyEntry;
}

export function WordFamilySection({ entry }: WordFamilySectionProps) {
  return (
    <Section className="vocabulary-section" id="word-family" title="Word family">
      <div className="compact-entry-list">
        {entry.wordFamily.map((item) => (
          <article key={`${item.normalizedWord}-${item.partOfSpeech}`}>
            <div>
              <strong>{item.word}</strong>
              {item.translationTr === undefined ? null : <p>{item.translationTr}</p>}
            </div>
            <StatusBadge>{formatPartOfSpeech(item.partOfSpeech)}</StatusBadge>
          </article>
        ))}
      </div>
    </Section>
  );
}
