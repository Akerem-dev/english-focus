import type { VocabularyEntry } from "@platform/domain";

import { Section } from "../../../components";

interface CommonMistakesSectionProps {
  readonly entry: VocabularyEntry;
}

export function CommonMistakesSection({ entry }: CommonMistakesSectionProps) {
  return (
    <Section className="vocabulary-section" id="common-mistakes" title="Common mistakes">
      <div className="mistake-list">
        {entry.commonMistakes.map((mistake) => (
          <article key={mistake.incorrect}>
            <p className="mistake-list__incorrect">
              <span aria-hidden="true">×</span> {mistake.incorrect}
            </p>
            <p className="mistake-list__correct">
              <span aria-hidden="true">✓</span> {mistake.correct}
            </p>
            <small>{mistake.explanationTr}</small>
          </article>
        ))}
      </div>
    </Section>
  );
}
