import type { VocabularyEntry, VocabularyUserMetadata } from "@platform/domain";

import { useOptionalSettings } from "../../../app/providers";

import { EtymologySection } from "./EtymologySection";
import { ExampleSentenceList } from "./ExampleSentenceList";
import { MeaningsSection } from "./MeaningsSection";
import { MorphologySection } from "./MorphologySection";
import { PronunciationSection } from "./PronunciationSection";
import { VocabularyHeader } from "./VocabularyHeader";
import { VocabularyQuickSummary } from "./VocabularyQuickSummary";

interface VocabularyFoundStateProps {
  readonly entry: VocabularyEntry;
  readonly metadata?: VocabularyUserMetadata | undefined;
  readonly onBack: () => void;
  readonly onEditEntry: () => void;
  readonly onEditMetadata: () => void;
  readonly onImportReplacement: () => void;
  readonly onExport: () => void;
}

const BASE_DETAIL_LINKS = [
  ["overview", "Overview"],
  ["meanings", "Meanings"],
  ["examples", "Examples"],
  ["etymology", "Etymology"],
] as const;

export function VocabularyFoundState({
  entry,
  metadata,
  onBack,
  onEditEntry,
  onEditMetadata,
  onExport,
  onImportReplacement,
}: VocabularyFoundStateProps) {
  const settingsContext = useOptionalSettings();
  const showEtymology = settingsContext?.settings.content.showEtymology ?? true;
  const detailLinks = BASE_DETAIL_LINKS.filter(
    ([target]) =>
      target !== "etymology" ||
      (showEtymology && entry.etymology !== undefined),
  );

  return (
    <article
      className="route-page vocabulary-detail-page"
      aria-label={`${entry.word} vocabulary entry`}
    >
      <VocabularyHeader
        entry={entry}
        metadata={metadata}
        onBack={onBack}
        onEditEntry={onEditEntry}
        onEditMetadata={onEditMetadata}
        onExport={onExport}
        onImportReplacement={onImportReplacement}
      />

      <nav
        className="vocabulary-detail-nav"
        aria-label="Vocabulary entry sections"
      >
        {detailLinks.map(([target, label]) => (
          <button
            key={target}
            onClick={() => {
              document
                .getElementById(target)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="vocabulary-detail-layout">
        <div className="vocabulary-detail-main">
          <VocabularyQuickSummary entry={entry} />
          <MeaningsSection entry={entry} />
          <ExampleSentenceList entry={entry} />
        </div>

        <aside
          className="vocabulary-detail-aside"
          aria-label="Supporting vocabulary details"
        >
          <PronunciationSection entry={entry} />
          <MorphologySection entry={entry} />
          {showEtymology ? <EtymologySection entry={entry} /> : null}
        </aside>
      </div>
    </article>
  );
}
