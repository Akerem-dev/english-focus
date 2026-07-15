import type { VocabularyEntry } from "@platform/domain";

import { Section, StatusBadge } from "../../../components";
import { formatPlainLabel } from "../presenters/VocabularyEntryPresenter";

interface RelatedWordsSectionProps {
  readonly entry: VocabularyEntry;
}

export function RelatedWordsSection({ entry }: RelatedWordsSectionProps) {
  return (
    <Section className="vocabulary-section" id="related-words" title="Related words">
      <div className="compact-entry-list compact-entry-list--stacked">
        {entry.relatedWords.map((item) => (
          <article key={item.normalizedWord}>
            <div>
              <strong>{item.word}</strong>
              {item.distinctionTr === undefined ? null : <p>{item.distinctionTr}</p>}
            </div>
            <StatusBadge>{formatPlainLabel(item.relationship)}</StatusBadge>
          </article>
        ))}
      </div>
    </Section>
  );
}
