import type { VocabularyEntry, VocabularyUserMetadata } from "@platform/domain";

import { useOptionalSettings } from "../../../app/providers";
import { AppIcon } from "../../../design-system";
import { dispatchAssistantRequest } from "../../assistant";

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
  readonly backLabel?: string | undefined;
  readonly onBack: () => void;
  readonly onEditEntry: () => void;
  readonly onEditMetadata: () => void;
  readonly onImportReplacement: () => void;
  readonly onExport: () => void;
}

export function VocabularyFoundState({
  backLabel = "Back to vocabulary",
  entry,
  metadata,
  onBack,
  onEditEntry,
  onEditMetadata,
  onExport,
  onImportReplacement
}: VocabularyFoundStateProps) {
  const settingsContext = useOptionalSettings();
  const showEtymology = settingsContext?.settings.content.showEtymology ?? true;
  const primaryMeaning = entry.meanings[0];
  const primaryExample = entry.examples[0];
  const pronunciation = entry.pronunciations[0]?.ipa;
  const englishDefinition =
    primaryMeaning?.definitionEn ?? "A clear English definition is not available for this word.";
  const turkishDefinition =
    primaryMeaning?.translationsTr.join(", ") ?? "Türkçe açıklama henüz mevcut değil.";
  const exampleSentence =
    primaryExample?.sentenceEn ?? "A natural example sentence is not available for this word.";

  return (
    <article
      aria-label={`${entry.word} vocabulary entry`}
      className="route-page vocabulary-detail-page wv84-result-page"
    >
      <section className="wv84-result-card">
        <header className="wv84-result-card__header">
          <button className="wv84-result-card__back" onClick={onBack} type="button">
            ‹&nbsp;&nbsp;Back to results
          </button>
          <button
            aria-label={metadata?.favorite === true ? "Edit favorite" : "Add to favorites"}
            className="wv84-result-card__favorite"
            onClick={onEditMetadata}
            type="button"
          >
            <AppIcon name="star" size={30} />
          </button>
          <div className="wv84-result-card__identity">
            <h1>{entry.word}</h1>
            <span className="wv84-result-card__cefr">{entry.cefr}</span>
            {pronunciation === undefined ? null : (
              <p className="wv84-result-card__pronunciation">
                /{pronunciation.replaceAll("/", "")}/
              </p>
            )}
          </div>
        </header>

        <nav aria-label="Vocabulary entry sections" className="wv84-result-tabs">
          <button aria-current="page" type="button">
            Definition
          </button>
          <button type="button">Examples</button>
          <button type="button">Synonyms</button>
          <button
            onClick={() => dispatchAssistantRequest({ kind: "open", word: entry.word })}
            type="button"
          >
            Word Family
          </button>
        </nav>

        <section className="wv84-definition-card">
          <div className="wv84-definition-block">
            <span aria-hidden="true" className="wv84-leaf-mark" />
            <div>
              <h2>English Definition</h2>
              <p>{englishDefinition}</p>
            </div>
          </div>
          <div className="wv84-definition-card__rule" />
          <div className="wv84-definition-block">
            <span aria-hidden="true" className="wv84-leaf-mark" />
            <div>
              <h2>Türkçe Açıklama</h2>
              <p>{turkishDefinition}</p>
            </div>
          </div>
        </section>

        <div className="wv84-result-actions">
          <button className="wv84-primary-action" onClick={onEditMetadata} type="button">
            <span aria-hidden="true" className="wv84-leaf-mark" />
            <span>Save to Valley</span>
          </button>
          <button className="wv84-secondary-action" onClick={onEditMetadata} type="button">
            <AppIcon name="book-open" size={22} />
            <span>Practice</span>
          </button>
        </div>

        <section className="wv84-example-card">
          <div>
            <h2>Example Sentence</h2>
            <p>{exampleSentence}</p>
          </div>
          <AppIcon label="Read example aloud" name="volume" size={30} />
        </section>
      </section>

      <div className="wv84-found-legacy">
        <VocabularyHeader
          backLabel={backLabel}
          entry={entry}
          metadata={metadata}
          onBack={onBack}
          onEditEntry={onEditEntry}
          onEditMetadata={onEditMetadata}
          onExport={onExport}
          onImportReplacement={onImportReplacement}
        />
        <VocabularyQuickSummary entry={entry} />
        <MeaningsSection entry={entry} />
        <ExampleSentenceList entry={entry} />
        <PronunciationSection entry={entry} />
        <MorphologySection entry={entry} />
        {showEtymology ? <EtymologySection entry={entry} /> : null}
      </div>
    </article>
  );
}
