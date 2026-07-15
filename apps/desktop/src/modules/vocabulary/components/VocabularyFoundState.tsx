import type { VocabularyEntry, VocabularyUserMetadata } from "@platform/domain";

import { useOptionalSettings } from "../../../app/providers";

import { CollocationsSection } from "./CollocationsSection";
import { CommonMistakesSection } from "./CommonMistakesSection";
import { EtymologySection } from "./EtymologySection";
import { ExampleSentenceList } from "./ExampleSentenceList";
import { GrammarSection } from "./GrammarSection";
import { MeaningsSection } from "./MeaningsSection";
import { MorphologySection } from "./MorphologySection";
import { PrepositionPatternsSection } from "./PrepositionPatternsSection";
import { PronunciationSection } from "./PronunciationSection";
import { RelatedWordsSection } from "./RelatedWordsSection";
import { SentenceFormsSection } from "./SentenceFormsSection";
import { TenseExamplesSection } from "./TenseExamplesSection";
import { VocabularyHeader } from "./VocabularyHeader";
import { VocabularyQuickSummary } from "./VocabularyQuickSummary";
import { WordFamilySection } from "./WordFamilySection";

interface VocabularyFoundStateProps {
  readonly entry: VocabularyEntry;
  readonly metadata?: VocabularyUserMetadata | undefined;
  readonly onBack: () => void;
  readonly onEditMetadata: () => void;
  readonly onImportReplacement: () => void;
  readonly onExport: () => void;
}

const BASE_DETAIL_LINKS = [
  ["overview", "Overview"],
  ["meanings", "Meanings"],
  ["grammar", "Grammar"],
  ["examples", "Examples"],
  ["collocations", "Collocations"],
  ["word-family", "Word family"],
  ["related-words", "Related words"],
  ["common-mistakes", "Common mistakes"],
  ["etymology", "Etymology"]
] as const;

export function VocabularyFoundState({
  entry,
  metadata,
  onBack,
  onEditMetadata,
  onExport,
  onImportReplacement
}: VocabularyFoundStateProps) {
  const settingsContext = useOptionalSettings();
  const contentSettings = settingsContext?.settings.content ?? {
    showEtymology: true,
    showCommonMistakes: true,
    exampleSentenceCount: 10 as const
  };
  const detailLinks = BASE_DETAIL_LINKS.filter(([target]) => {
    if (target === "common-mistakes") {
      return contentSettings.showCommonMistakes;
    }

    if (target === "etymology") {
      return contentSettings.showEtymology;
    }

    return true;
  });

  return (
    <article
      className="route-page vocabulary-detail-page"
      aria-label={`${entry.word} vocabulary entry`}
    >
      <VocabularyHeader
        entry={entry}
        metadata={metadata}
        onBack={onBack}
        onEditMetadata={onEditMetadata}
        onExport={onExport}
        onImportReplacement={onImportReplacement}
      />

      <nav className="vocabulary-detail-nav" aria-label="Vocabulary entry sections">
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
          <GrammarSection entry={entry} />
          <TenseExamplesSection entry={entry} />
          <SentenceFormsSection entry={entry} />
          <PrepositionPatternsSection entry={entry} />
          <ExampleSentenceList entry={entry} limit={contentSettings.exampleSentenceCount} />
        </div>

        <aside className="vocabulary-detail-aside" aria-label="Supporting vocabulary details">
          <PronunciationSection entry={entry} />
          <MorphologySection entry={entry} />
          <WordFamilySection entry={entry} />
          <CollocationsSection entry={entry} />
          <RelatedWordsSection entry={entry} />
          {contentSettings.showCommonMistakes ? <CommonMistakesSection entry={entry} /> : null}
          {contentSettings.showEtymology ? <EtymologySection entry={entry} /> : null}
        </aside>
      </div>
    </article>
  );
}
