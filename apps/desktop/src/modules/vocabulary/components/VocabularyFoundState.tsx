import { useState } from "react";

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

type ResultTab = "definition" | "examples" | "synonyms" | "word-family";

interface VocabularyFoundStateProps {
  readonly entry: VocabularyEntry;
  readonly metadata?: VocabularyUserMetadata | undefined;
  readonly backLabel?: string | undefined;
  readonly onBack: () => void;
  readonly onEditEntry: () => void;
  readonly onEditMetadata: () => void;
  readonly onToggleFavorite?: (() => void) | undefined;
  readonly onImportReplacement: () => void;
  readonly onExport: () => void;
}

function speakEnglish(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.92;
  window.speechSynthesis.speak(utterance);
}

export function VocabularyFoundState({
  backLabel = "Back to vocabulary",
  entry,
  metadata,
  onBack,
  onEditEntry,
  onEditMetadata,
  onToggleFavorite = onEditMetadata,
  onExport,
  onImportReplacement
}: VocabularyFoundStateProps) {
  const settingsContext = useOptionalSettings();
  const [activeTab, setActiveTab] = useState<ResultTab>("definition");
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
  const favorite = metadata?.favorite === true;
  const morphologyParts = [
    ["Base form", entry.morphology.baseForm],
    ["Root", entry.morphology.root],
    ["Prefix", entry.morphology.prefix],
    ["Suffix", entry.morphology.suffix]
  ].filter((item): item is [string, string] => item[1] !== undefined && item[1].length > 0);

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
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={favorite}
            className="wv84-result-card__favorite"
            onClick={onToggleFavorite}
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
          <button
            aria-current={activeTab === "definition" ? "page" : undefined}
            onClick={() => setActiveTab("definition")}
            type="button"
          >
            Definition
          </button>
          <button
            aria-current={activeTab === "examples" ? "page" : undefined}
            onClick={() => setActiveTab("examples")}
            type="button"
          >
            Examples
          </button>
          <button
            aria-current={activeTab === "synonyms" ? "page" : undefined}
            onClick={() => setActiveTab("synonyms")}
            type="button"
          >
            Synonyms
          </button>
          <button
            aria-current={activeTab === "word-family" ? "page" : undefined}
            onClick={() => setActiveTab("word-family")}
            type="button"
          >
            Word Family
          </button>
        </nav>

        <section className="wv84-definition-card">
          {activeTab === "definition" ? (
            <>
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
            </>
          ) : null}

          {activeTab === "examples" ? (
            <div className="wv84-tab-content wv84-tab-content--examples">
              {entry.examples.length === 0 ? (
                <p>No verified examples are available for this entry.</p>
              ) : (
                entry.examples.slice(0, 3).map((example) => (
                  <div className="wv84-tab-example" key={example.id}>
                    <strong>{example.sentenceEn}</strong>
                    <span>{example.translationTr}</span>
                  </div>
                ))
              )}
            </div>
          ) : null}

          {activeTab === "synonyms" ? (
            <div className="wv84-tab-content wv84-tab-content--empty">
              <span aria-hidden="true" className="wv84-leaf-mark" />
              <div>
                <h2>Compare similar words with Wordie</h2>
                <p>
                  Synonyms are not stored in this vocabulary entry, so the app will not invent a
                  list.
                </p>
                <button
                  onClick={() => dispatchAssistantRequest({ kind: "open", word: entry.word })}
                  type="button"
                >
                  Ask Wordie to compare
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === "word-family" ? (
            <div className="wv84-tab-content wv84-tab-content--family">
              <div className="wv84-family-grid">
                {morphologyParts.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              {entry.morphology.inflectedForms.length > 0 ? (
                <div className="wv84-family-forms">
                  {entry.morphology.inflectedForms.slice(0, 8).map((form) => (
                    <span key={`${form.form}-${form.type}`}>{form.form}</span>
                  ))}
                </div>
              ) : (
                <p>No additional word forms are stored for this entry.</p>
              )}
            </div>
          ) : null}
        </section>

        <div className="wv84-result-actions">
          <button
            aria-pressed={favorite}
            className="wv84-primary-action"
            onClick={onToggleFavorite}
            type="button"
          >
            <span aria-hidden="true" className="wv84-leaf-mark" />
            <span>{favorite ? "Saved to Valley" : "Save to Valley"}</span>
          </button>
          <button
            className="wv84-secondary-action"
            onClick={() => dispatchAssistantRequest({ kind: "open", word: entry.word })}
            type="button"
          >
            <AppIcon name="book-open" size={22} />
            <span>Practice</span>
          </button>
        </div>

        <section className="wv84-example-card">
          <div>
            <h2>Example Sentence</h2>
            <p>{exampleSentence}</p>
          </div>
          <button
            aria-label="Read example aloud"
            disabled={primaryExample === undefined}
            onClick={() => speakEnglish(exampleSentence)}
            type="button"
          >
            <AppIcon name="volume" size={30} />
          </button>
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
