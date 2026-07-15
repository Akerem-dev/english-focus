import type { VocabularyEntry } from "@platform/domain";

import { Section, StatusBadge } from "../../../components";
import { formatPlainLabel } from "../presenters/VocabularyEntryPresenter";

interface EtymologySectionProps {
  readonly entry: VocabularyEntry;
}

export function EtymologySection({ entry }: EtymologySectionProps) {
  if (entry.etymology === undefined) {
    return null;
  }

  return (
    <Section className="vocabulary-section" id="etymology" title="Etymology">
      <div className="etymology-meta">
        <StatusBadge tone="success">
          {formatPlainLabel(entry.etymology.certainty)} certainty
        </StatusBadge>
        {entry.etymology.originLanguage === undefined ? null : (
          <span>{entry.etymology.originLanguage}</span>
        )}
        {entry.etymology.originForm === undefined ? null : (
          <span className="monospace">{entry.etymology.originForm}</span>
        )}
      </div>
      <p>{entry.etymology.explanationTr}</p>
      <p className="section-note section-note--english">{entry.etymology.explanationEn}</p>
    </Section>
  );
}
