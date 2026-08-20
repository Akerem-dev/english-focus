import { useEffect, useMemo, useState } from "react";

import type { VocabularyEntry } from "@platform/domain";

import { useVocabularyMetadata, useVocabularyRepository } from "../../../app/providers";
import valleyBackground from "../../../assets/background/home-background-static.png";
import { CefrBadge } from "../../../components";
import { LibraryPagePhase2 } from "./LibraryPagePhase2";

type DetailTab = "definition" | "examples" | "forms" | "usage";

interface DetailSelection {
  readonly normalizedWord: string;
  readonly contextLabel: string;
  readonly source: "collection" | "all-words";
}

const TAB_LABELS: Readonly<Record<DetailTab, string>> = Object.freeze({
  definition: "Definition",
  examples: "Examples",
  forms: "Word forms",
  usage: "Usage"
});

function findEntryByVisibleWord(
  entries: readonly VocabularyEntry[],
  visibleWord: string
): VocabularyEntry | undefined {
  const normalized = visibleWord.trim().toLocaleLowerCase("en");
  return entries.find(
    (entry) =>
      entry.word.trim().toLocaleLowerCase("en") === normalized ||
      entry.normalizedWord.trim().toLocaleLowerCase("en") === normalized
  );
}

function readableInflectionType(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function primaryTranslation(entry: VocabularyEntry): string {
  const values = entry.meanings.flatMap((meaning) => meaning.translationsTr);
  return values.slice(0, 4).join(", ") || "—";
}

function RichWordDetail({
  entry,
  selection,
  onBack
}: {
  readonly entry: VocabularyEntry;
  readonly selection: DetailSelection;
  readonly onBack: () => void;
}) {
  const { getMetadata } = useVocabularyMetadata();
  const [tab, setTab] = useState<DetailTab>("definition");
  const metadata = getMetadata(entry.normalizedWord);
  const pronunciation = entry.pronunciations[0];
  const examples = entry.examples.slice(0, 3);
  const usageNotes = entry.meanings.filter(
    (meaning) => meaning.usageNoteEn !== undefined || meaning.usageNoteTr !== undefined
  );
  const forms = entry.morphology.inflectedForms;
  const registers = Array.from(
    new Set([...entry.registers, ...entry.meanings.flatMap((meaning) => meaning.registers)])
  );

  useEffect(() => {
    setTab("definition");
  }, [entry.normalizedWord]);

  return (
    <div className="wvc-phase3-detail-layer">
      <div
        aria-hidden="true"
        className="wvc-phase3-scene"
        style={{ backgroundImage: `url("${valleyBackground}")` }}
      />
      <div aria-hidden="true" className="wvc-phase3-mist" />

      <main className="wvc-phase3-shell">
        <button className="wvc-phase3-back" onClick={onBack} type="button">
          ← {selection.source === "all-words" ? "All Words" : selection.contextLabel}
        </button>

        <article className="wvc-phase3-card">
          <header className="wvc-phase3-hero">
            <div className="wvc-phase3-hero__main">
              <p className="wvc-eyebrow">
                {selection.source === "all-words"
                  ? "FROM YOUR WORDBOOK"
                  : `IN ${selection.contextLabel.toUpperCase()}`}
              </p>
              <h1>{entry.word}</h1>
              <div className="wvc-phase3-meta">
                {pronunciation?.ipa ? (
                  <span className="wvc-phase3-ipa">
                    /{pronunciation.ipa.replace(/^\/+|\/+$/g, "")}/
                  </span>
                ) : null}
                {pronunciation?.variant && pronunciation.variant !== "general" ? (
                  <span>{pronunciation.variant.toUpperCase()}</span>
                ) : null}
                <CefrBadge level={entry.cefr} showPrefix={false} />
                {entry.partsOfSpeech.length > 0 ? (
                  <span>{entry.partsOfSpeech.join(" · ")}</span>
                ) : null}
              </div>
            </div>

            <div className="wvc-phase3-hero__translation">
              <span>TÜRKÇE</span>
              <strong>{primaryTranslation(entry)}</strong>
            </div>
          </header>

          <nav aria-label={`${entry.word} details`} className="wvc-phase3-tabs">
            {(Object.keys(TAB_LABELS) as DetailTab[]).map((key) => (
              <button
                aria-current={tab === key ? "page" : undefined}
                key={key}
                onClick={() => setTab(key)}
                type="button"
              >
                {TAB_LABELS[key]}
                {key === "examples" && examples.length > 0 ? (
                  <small>{examples.length}</small>
                ) : null}
              </button>
            ))}
          </nav>

          <div className="wvc-phase3-content">
            {tab === "definition" ? (
              <section className="wvc-phase3-definition" aria-label="Definitions">
                {entry.meanings.length === 0 ? (
                  <div className="wvc-phase3-empty-copy">
                    No definition is saved for this word yet.
                  </div>
                ) : (
                  entry.meanings.map((meaning, index) => (
                    <article className="wvc-phase3-meaning" key={meaning.id}>
                      <div className="wvc-phase3-meaning__index">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="wvc-phase3-meaning__body">
                        <div className="wvc-phase3-meaning__meta">
                          <span>{meaning.partOfSpeech}</span>
                          {meaning.registers.length > 0 ? (
                            <span>{meaning.registers.join(" · ")}</span>
                          ) : null}
                        </div>
                        <h2>{meaning.definitionEn}</h2>
                        {meaning.translationsTr.length > 0 ? (
                          <p className="wvc-phase3-tr">{meaning.translationsTr.join(", ")}</p>
                        ) : null}
                        {meaning.usageNoteEn || meaning.usageNoteTr ? (
                          <div className="wvc-phase3-usage-note">
                            {meaning.usageNoteEn ? <p>{meaning.usageNoteEn}</p> : null}
                            {meaning.usageNoteTr ? <p>{meaning.usageNoteTr}</p> : null}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  ))
                )}
              </section>
            ) : null}

            {tab === "examples" ? (
              <section className="wvc-phase3-examples" aria-label="Example sentences">
                {examples.length === 0 ? (
                  <div className="wvc-phase3-empty-copy">
                    No example sentence is saved for this word yet.
                  </div>
                ) : (
                  examples.map((example, index) => (
                    <article className="wvc-phase3-example" key={example.id}>
                      <div className="wvc-phase3-example__number">0{index + 1}</div>
                      <div>
                        <blockquote>{example.sentenceEn}</blockquote>
                        <p>{example.translationTr}</p>
                        {example.context || example.grammarLabel || example.targetForm ? (
                          <div className="wvc-phase3-example__notes">
                            {example.context ? <span>{example.context}</span> : null}
                            {example.grammarLabel ? <span>{example.grammarLabel}</span> : null}
                            {example.targetForm ? (
                              <span>Target form: {example.targetForm}</span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  ))
                )}
              </section>
            ) : null}

            {tab === "forms" ? (
              <section className="wvc-phase3-forms" aria-label="Word forms">
                <div className="wvc-phase3-form-summary">
                  <div>
                    <span>BASE FORM</span>
                    <strong>{entry.morphology.baseForm || entry.word}</strong>
                  </div>
                  {entry.morphology.root ? (
                    <div>
                      <span>ROOT</span>
                      <strong>{entry.morphology.root}</strong>
                    </div>
                  ) : null}
                  {entry.morphology.prefix ? (
                    <div>
                      <span>PREFIX</span>
                      <strong>{entry.morphology.prefix}</strong>
                    </div>
                  ) : null}
                  {entry.morphology.suffix ? (
                    <div>
                      <span>SUFFIX</span>
                      <strong>{entry.morphology.suffix}</strong>
                    </div>
                  ) : null}
                </div>

                {forms.length > 0 ? (
                  <div className="wvc-phase3-form-list">
                    {forms.map((form) => (
                      <div
                        className="wvc-phase3-form-row"
                        key={`${form.type}-${form.normalizedForm}`}
                      >
                        <span>{readableInflectionType(form.type)}</span>
                        <strong>{form.form}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="wvc-phase3-empty-copy">
                    No additional forms are saved for this word.
                  </div>
                )}

                {entry.morphology.notesEn || entry.morphology.notesTr ? (
                  <div className="wvc-phase3-language-note">
                    {entry.morphology.notesEn ? <p>{entry.morphology.notesEn}</p> : null}
                    {entry.morphology.notesTr ? <p>{entry.morphology.notesTr}</p> : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            {tab === "usage" ? (
              <section className="wvc-phase3-usage" aria-label="Usage and grammar">
                <article className="wvc-phase3-usage-card">
                  <span className="wvc-section-label">GRAMMAR & USAGE</span>
                  <h2>{entry.grammar.summaryEn}</h2>
                  {entry.grammar.summaryTr ? <p>{entry.grammar.summaryTr}</p> : null}
                </article>

                {registers.length > 0 ? (
                  <article className="wvc-phase3-usage-card wvc-phase3-usage-card--compact">
                    <span className="wvc-section-label">REGISTER</span>
                    <p>{registers.join(", ")}</p>
                  </article>
                ) : null}

                {usageNotes.length > 0 ? (
                  <article className="wvc-phase3-usage-card">
                    <span className="wvc-section-label">USAGE NOTES</span>
                    {usageNotes.map((meaning) => (
                      <div className="wvc-phase3-usage-pair" key={meaning.id}>
                        {meaning.usageNoteEn ? <p>{meaning.usageNoteEn}</p> : null}
                        {meaning.usageNoteTr ? <p>{meaning.usageNoteTr}</p> : null}
                      </div>
                    ))}
                  </article>
                ) : null}

                {metadata?.note ? (
                  <article className="wvc-phase3-usage-card wvc-phase3-personal-note">
                    <span className="wvc-section-label">MY NOTE</span>
                    <p>{metadata.note}</p>
                  </article>
                ) : null}
              </section>
            ) : null}
          </div>
        </article>
      </main>
    </div>
  );
}

function CollectionsRichWordController() {
  const { contentSource } = useVocabularyRepository();
  const entries = useMemo(() => contentSource.listEntries(), [contentSource]);
  const [selection, setSelection] = useState<DetailSelection>();

  useEffect(() => {
    let frame = 0;

    const enhanceRows = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document
          .querySelectorAll<HTMLElement>(".application-frame--collections-cleanroom .wvc-alpha-row")
          .forEach((row) => {
            row.tabIndex = 0;
            row.setAttribute("role", "button");
            const word = row.querySelector(".wvc-alpha-row__word strong")?.textContent?.trim();
            if (word) {
              row.setAttribute("aria-label", `Open details for ${word}`);
            }
          });
      });
    };

    const openFromTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof Element)) {
        return false;
      }

      const alphaRow = target.closest<HTMLElement>(".wvc-alpha-row");
      if (alphaRow !== null) {
        const word = alphaRow.querySelector(".wvc-alpha-row__word strong")?.textContent ?? "";
        const entry = findEntryByVisibleWord(entries, word);
        if (entry === undefined) {
          return false;
        }
        setSelection({
          normalizedWord: entry.normalizedWord,
          contextLabel: "All Words",
          source: "all-words"
        });
        return true;
      }

      const collectionWordTarget = target.closest<HTMLElement>(".wvc-word-open, .wvc-word-meaning");
      if (collectionWordTarget !== null) {
        const row = collectionWordTarget.closest<HTMLElement>(".wvc-word-row");
        const word = row?.querySelector(".wvc-word-open strong")?.textContent ?? "";
        const entry = findEntryByVisibleWord(entries, word);
        if (entry === undefined) {
          return false;
        }
        const collectionTitle =
          document
            .querySelector<HTMLElement>(
              ".application-frame--collections-cleanroom .wvc-collection-hero h1"
            )
            ?.textContent?.trim() || "Collection";
        setSelection({
          normalizedWord: entry.normalizedWord,
          contextLabel: collectionTitle,
          source: "collection"
        });
        return true;
      }

      return false;
    };

    const onClick = (event: MouseEvent) => {
      if (selection !== undefined) {
        return;
      }
      if (openFromTarget(event.target)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (selection !== undefined || (event.key !== "Enter" && event.key !== " ")) {
        return;
      }
      if (!(event.target instanceof Element) || event.target.closest(".wvc-alpha-row") === null) {
        return;
      }
      if (openFromTarget(event.target)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    enhanceRows();
    const observer = new MutationObserver(enhanceRows);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [entries, selection]);

  const entry =
    selection === undefined
      ? undefined
      : entries.find((candidate) => candidate.normalizedWord === selection.normalizedWord);

  if (selection === undefined || entry === undefined) {
    return null;
  }

  return (
    <RichWordDetail entry={entry} onBack={() => setSelection(undefined)} selection={selection} />
  );
}

export function LibraryPagePhase3() {
  return (
    <>
      <LibraryPagePhase2 />
      <CollectionsRichWordController />
    </>
  );
}
