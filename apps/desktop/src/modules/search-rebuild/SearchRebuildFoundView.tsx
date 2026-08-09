import { useState } from "react";

import type { VocabularyEntry, VocabularyUserMetadata } from "@platform/domain";

import { AppIcon } from "../../design-system";
import { dispatchAssistantRequest } from "../assistant";

import "./search-rebuild.css";

type SearchRebuildDetailTab = "definition" | "examples" | "synonyms" | "word-family";

export interface SearchRebuildFoundViewProps {
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

export function SearchRebuildFoundView({
  backLabel = "Back to vocabulary",
  entry,
  metadata,
  onBack,
  onEditEntry,
  onEditMetadata,
  onToggleFavorite = onEditMetadata,
  onImportReplacement,
  onExport
}: SearchRebuildFoundViewProps) {
  const [activeTab, setActiveTab] = useState<SearchRebuildDetailTab>("definition");

  const primaryMeaning = entry.meanings[0];
  const pronunciation = entry.pronunciations[0]?.ipa;
  const favorite = metadata?.favorite === true;
  const englishDefinition =
    primaryMeaning?.definitionEn ?? "An English definition isn’t available for this word yet.";
  const turkishDefinition =
    primaryMeaning?.translationsTr.join(", ") ?? "Türkçe açıklama henüz mevcut değil.";
  const examples = entry.examples.slice(0, 3);
  const morphologyParts = [
    ["Base form", entry.morphology.baseForm],
    ["Root", entry.morphology.root],
    ["Prefix", entry.morphology.prefix],
    ["Suffix", entry.morphology.suffix]
  ].filter((item): item is [string, string] => item[1] !== undefined && item[1].length > 0);

  return (
    <article
      aria-label={`${entry.word} vocabulary entry`}
      className="wvsr-detail-root"
      data-search-ui="rebuild-detail-v1"
    >
      <div className="wvsr-detail-root__wash" aria-hidden="true" />

      <section className="wvsr-detail-card">
        <header className="wvsr-detail-header">
          <button
            aria-label={backLabel}
            className="wvsr-detail-back"
            onClick={onBack}
            type="button"
          >
            <span aria-hidden="true">←</span>
            <span>Back to results</span>
          </button>

          <details className="wvsr-detail-menu">
            <summary aria-label="Entry options">•••</summary>
            <div className="wvsr-detail-menu__popover">
              <button onClick={onEditEntry} type="button">Edit entry</button>
              <button onClick={onEditMetadata} type="button">Edit personal data</button>
              <button onClick={onImportReplacement} type="button">Import replacement</button>
              <button onClick={onExport} type="button">Export entry</button>
            </div>
          </details>

          <div className="wvsr-detail-identity">
            <h1>{entry.word}</h1>
            {pronunciation === undefined ? null : (
              <span className="wvsr-detail-pronunciation">
                /{pronunciation.replaceAll("/", "")}/
              </span>
            )}
            <span className="wvsr-detail-cefr">{entry.cefr}</span>
          </div>
        </header>

        <nav aria-label="Vocabulary entry sections" className="wvsr-detail-tabs">
          {([
            ["definition", "Definition"],
            ["examples", "Examples"],
            ["synonyms", "Synonyms"],
            ["word-family", "Word Family"]
          ] as const).map(([tab, label]) => (
            <button
              aria-current={activeTab === tab ? "page" : undefined}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>

        <section className="wvsr-detail-content">
          {activeTab === "definition" ? (
            <div className="wvsr-detail-definition">
              <div className="wvsr-detail-definition__block">
                <h2>English Definition</h2>
                <p>{englishDefinition}</p>
              </div>
              <div className="wvsr-detail-rule" />
              <div className="wvsr-detail-definition__block">
                <h2>Türkçe Anlamı</h2>
                <p>{turkishDefinition}</p>
              </div>
            </div>
          ) : null}

          {activeTab === "examples" ? (
            <div className="wvsr-detail-examples">
              {examples.length === 0 ? (
                <div className="wvsr-detail-empty">
                  <strong>No examples are available for this word yet.</strong>
                  <span>Wordie can help you explore how this word is used.</span>
                  <button
                    onClick={() => dispatchAssistantRequest({ kind: "open", word: entry.word })}
                    type="button"
                  >
                    Ask Wordie
                  </button>
                </div>
              ) : (
                examples.map((example) => (
                  <article className="wvsr-detail-example-row" key={example.id}>
                    <strong>{example.sentenceEn}</strong>
                    <span>{example.translationTr}</span>
                  </article>
                ))
              )}
            </div>
          ) : null}

          {activeTab === "synonyms" ? (
            <div className="wvsr-detail-empty">
              <span className="wvsr-detail-empty__mark" aria-hidden="true">⌁</span>
              <strong>Compare similar words with Wordie</strong>
              <span>
                This word doesn’t have a synonym list yet. Wordie can help you compare similar
                words and their nuances.
              </span>
              <button
                onClick={() => dispatchAssistantRequest({ kind: "open", word: entry.word })}
                type="button"
              >
                Compare words
              </button>
            </div>
          ) : null}

          {activeTab === "word-family" ? (
            <div className="wvsr-detail-family">
              {morphologyParts.length > 0 ? (
                <div className="wvsr-detail-family__grid">
                  {morphologyParts.map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              ) : null}

              {entry.morphology.inflectedForms.length > 0 ? (
                <div className="wvsr-detail-family__forms">
                  {entry.morphology.inflectedForms.slice(0, 8).map((form) => (
                    <span key={`${form.form}-${form.type}`}>{form.form}</span>
                  ))}
                </div>
              ) : morphologyParts.length === 0 ? (
                <div className="wvsr-detail-empty">
                  <strong>No additional word-family details are available yet.</strong>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <div className="wvsr-detail-actions">
          <button
            aria-pressed={favorite}
            className="wvsr-detail-save"
            onClick={onToggleFavorite}
            type="button"
          >
            <AppIcon name="bookmark" size={21} />
            <span>{favorite ? "Saved to Valley" : "Save to Valley"}</span>
          </button>
          <button
            className="wvsr-detail-practice"
            onClick={() => dispatchAssistantRequest({ kind: "open", word: entry.word })}
            type="button"
          >
            <AppIcon name="book-open" size={21} />
            <span>Practice</span>
          </button>
        </div>

        <section className="wvsr-detail-example-card" aria-label="Example sentence">
          <h2>Example Sentence</h2>
          {entry.examples[0] === undefined ? (
            <p className="wvsr-detail-example-card__empty">No example is available yet.</p>
          ) : (
            <>
              <p>{entry.examples[0].sentenceEn}</p>
              <span>{entry.examples[0].translationTr}</span>
            </>
          )}
        </section>
      </section>

      <div className="wvsr-detail-language" aria-label="Current language">
        <span aria-hidden="true">◎</span>
        <span>English</span>
        <span aria-hidden="true">⌄</span>
      </div>
    </article>
  );
}