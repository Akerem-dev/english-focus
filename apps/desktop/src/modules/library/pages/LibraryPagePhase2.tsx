import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { VocabularyEntry } from "@platform/domain";

import { useVocabularyRepository } from "../../../app/providers";
import valleyBackground from "../../../assets/background/home-background-static.png";
import { LibraryPagePhase1 } from "./LibraryPagePhase1";

type LibraryMode = "collections" | "all-words";

type BrowseKey =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R"
  | "S"
  | "T"
  | "U"
  | "V"
  | "W"
  | "X"
  | "Y"
  | "Z"
  | "#";

const ALPHABET: readonly BrowseKey[] = Object.freeze(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("") as BrowseKey[]
);

const WORD_COLLATOR = new Intl.Collator("en", {
  sensitivity: "base",
  numeric: true
});

function primaryTranslation(entry: VocabularyEntry): string {
  const translations = entry.meanings.flatMap((meaning) => meaning.translationsTr);
  return translations.slice(0, 3).join(", ") || "—";
}

function browseKeyFor(entry: VocabularyEntry): BrowseKey {
  const firstCharacter = entry.normalizedWord.trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(firstCharacter) ? (firstCharacter as BrowseKey) : "#";
}

function ModeNav({
  mode,
  onChange,
  portal = false
}: {
  readonly mode: LibraryMode;
  readonly onChange: (mode: LibraryMode) => void;
  readonly portal?: boolean;
}) {
  return (
    <nav
      aria-label="Collections views"
      className={`wvc-mode-nav${portal ? " wvc-mode-nav--portal" : ""}`}
    >
      <button
        aria-current={mode === "collections" ? "page" : undefined}
        onClick={() => onChange("collections")}
        type="button"
      >
        Collections
      </button>
      <button
        aria-current={mode === "all-words" ? "page" : undefined}
        onClick={() => onChange("all-words")}
        type="button"
      >
        All Words
      </button>
    </nav>
  );
}

function CollectionsModeNavPortal({
  onChange
}: {
  readonly onChange: (mode: LibraryMode) => void;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let frame = 0;

    const resolveTarget = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nextTarget = document.querySelector<HTMLElement>(
          ".application-frame--collections-cleanroom .wvc-overview-header"
        );
        setTarget((current) => (current === nextTarget ? current : nextTarget));
      });
    };

    resolveTarget();

    const observer = new MutationObserver(resolveTarget);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  if (target === null) {
    return null;
  }

  return createPortal(
    <ModeNav mode="collections" onChange={onChange} portal />,
    target
  );
}

function AllWordsPage({
  onChangeMode
}: {
  readonly onChangeMode: (mode: LibraryMode) => void;
}) {
  const { contentSource, error, status } = useVocabularyRepository();
  const pageRef = useRef<HTMLDivElement>(null);

  const entries = useMemo(
    () =>
      [...contentSource.listEntries()].sort((left, right) =>
        WORD_COLLATOR.compare(left.word, right.word)
      ),
    [contentSource]
  );

  const groupedEntries = useMemo(() => {
    const groups = new Map<BrowseKey, VocabularyEntry[]>();

    for (const entry of entries) {
      const key = browseKeyFor(entry);
      const group = groups.get(key);
      if (group === undefined) {
        groups.set(key, [entry]);
      } else {
        group.push(entry);
      }
    }

    return groups;
  }, [entries]);

  const availableKeys = useMemo(() => {
    const keys = ALPHABET.filter((letter) => groupedEntries.has(letter));
    if (groupedEntries.has("#")) {
      return [...keys, "#" as const];
    }
    return keys;
  }, [groupedEntries]);

  const [activeKey, setActiveKey] = useState<BrowseKey>(availableKeys[0] ?? "A");

  useEffect(() => {
    if (!availableKeys.includes(activeKey)) {
      setActiveKey(availableKeys[0] ?? "A");
    }
  }, [activeKey, availableKeys]);

  useEffect(() => {
    const page = pageRef.current;
    if (page === null || availableKeys.length === 0) {
      return;
    }

    let frame = 0;

    const updateActiveKey = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const pageTop = page.getBoundingClientRect().top;
        let current = availableKeys[0] ?? "A";

        for (const key of availableKeys) {
          const section = page.querySelector<HTMLElement>(`[data-browse-key="${key}"]`);
          if (section === null) {
            continue;
          }

          const sectionTop = section.getBoundingClientRect().top - pageTop;
          if (sectionTop <= 184) {
            current = key;
          } else {
            break;
          }
        }

        setActiveKey((previous) => (previous === current ? previous : current));
      });
    };

    updateActiveKey();
    page.addEventListener("scroll", updateActiveKey, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      page.removeEventListener("scroll", updateActiveKey);
    };
  }, [availableKeys]);

  function jumpTo(key: BrowseKey) {
    const page = pageRef.current;
    const section = page?.querySelector<HTMLElement>(`[data-browse-key="${key}"]`);
    if (section === null || section === undefined) {
      return;
    }

    setActiveKey(key);
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="wvc-page wvc-page--all-words" ref={pageRef}>
      <div
        className="wvc-scene"
        style={{ backgroundImage: `url("${valleyBackground}")` }}
      />
      <div className="wvc-mist" />

      <main className="wvc-shell wvc-shell--all-words">
        <section className="wvc-allwords-header">
          <ModeNav mode="all-words" onChange={onChangeMode} />
          <div className="wvc-allwords-header__copy">
            <div>
              <p className="wvc-eyebrow">YOUR WORDBOOK</p>
              <h1>All Words</h1>
              <p>
                {entries.length.toLocaleString()} {entries.length === 1 ? "word" : "words"}, arranged from A to Z.
              </p>
            </div>
            <span className="wvc-allwords-total" aria-label={`${entries.length} total words`}>
              {entries.length.toLocaleString()}
              <small>WORDS</small>
            </span>
          </div>
        </section>

        {status === "error" ? (
          <section className="wvc-allwords-empty" role="alert">
            <h2>All Words couldn’t open</h2>
            <p>{error ?? "Please try again in a moment."}</p>
          </section>
        ) : status === "loading" && entries.length === 0 ? (
          <section className="wvc-allwords-empty" aria-live="polite">
            <h2>Gathering your words…</h2>
          </section>
        ) : entries.length === 0 ? (
          <section className="wvc-allwords-empty">
            <h2>Your alphabet is waiting for its first word</h2>
            <p>Words you add to Word Valley will appear here automatically.</p>
          </section>
        ) : (
          <>
            <nav className="wvc-alphabet" aria-label="Browse words by first letter">
              {ALPHABET.map((letter) => {
                const available = groupedEntries.has(letter);
                return (
                  <button
                    aria-current={activeKey === letter ? "location" : undefined}
                    disabled={!available}
                    key={letter}
                    onClick={() => jumpTo(letter)}
                    type="button"
                  >
                    {letter}
                  </button>
                );
              })}
              {groupedEntries.has("#") ? (
                <button
                  aria-current={activeKey === "#" ? "location" : undefined}
                  onClick={() => jumpTo("#")}
                  type="button"
                >
                  #
                </button>
              ) : null}
            </nav>

            <div className="wvc-alpha-directory">
              {availableKeys.map((key) => {
                const group = groupedEntries.get(key) ?? [];
                return (
                  <section className="wvc-alpha-section" data-browse-key={key} key={key}>
                    <div className="wvc-alpha-section__letter" aria-hidden="true">
                      {key}
                    </div>
                    <div className="wvc-alpha-section__content">
                      <header>
                        <h2>{key === "#" ? "Other" : key}</h2>
                        <span>{group.length} {group.length === 1 ? "word" : "words"}</span>
                      </header>

                      <div className="wvc-alpha-rows">
                        {group.map((entry) => (
                          <article className="wvc-alpha-row" key={entry.normalizedWord}>
                            <div className="wvc-alpha-row__word">
                              <strong>{entry.word}</strong>
                              <small>{entry.partsOfSpeech[0] ?? "word"}</small>
                            </div>
                            <p>{primaryTranslation(entry)}</p>
                            <span className="wvc-alpha-row__level">{entry.cefr}</span>
                          </article>
                        ))}
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export function LibraryPagePhase2() {
  const [mode, setMode] = useState<LibraryMode>("collections");

  if (mode === "all-words") {
    return <AllWordsPage onChangeMode={setMode} />;
  }

  return (
    <>
      <LibraryPagePhase1 />
      <CollectionsModeNavPortal onChange={setMode} />
    </>
  );
}
