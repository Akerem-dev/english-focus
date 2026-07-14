import { useState, type FormEvent } from "react";

import { Button, SearchInput } from "../../../components";
import { AppIcon } from "../../../design-system";

const RECENT_WORDS = ["maintain", "allocate", "vivid", "derive"] as const;
const RECENT_ADDITIONS = ["concise", "sustain", "infer", "pursue"] as const;

interface WordListCardProps {
  readonly title: string;
  readonly eyebrow: string;
  readonly words: readonly string[];
}

function WordListCard({ eyebrow, title, words }: WordListCardProps) {
  return (
    <section className="word-list-card">
      <header className="word-list-card__header">
        <h2>{title}</h2>
        <span>{eyebrow}</span>
      </header>
      <div className="word-list-card__rows">
        {words.map((word) => (
          <div className="word-list-row" key={word}>
            <span className="word-list-row__word">
              <AppIcon name="book-open" size={16} />
              {word}
            </span>
            <span className="word-list-row__meta">Local entry</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function VocabularyPage() {
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <div className="route-page route-page--vocabulary">
      <section className="vocabulary-hero" aria-labelledby="vocabulary-heading">
        <p className="route-page__eyebrow">Local English vocabulary</p>
        <h1 id="vocabulary-heading">Look up an English word</h1>
        <p className="vocabulary-hero__description">
          Meaning, Turkish translation, grammar usage, word family, and carefully structured example
          sentences—all stored on this device.
        </p>
        <form className="vocabulary-search" onSubmit={handleSubmit}>
          <SearchInput
            aria-label="Search vocabulary"
            label="Search vocabulary"
            onChange={(event) => {
              setQuery(event.currentTarget.value);
            }}
            onClear={() => {
              setQuery("");
            }}
            placeholder="Type an English word"
            value={query}
          />
          <Button
            aria-label="Search word"
            className="vocabulary-search__button"
            leadingIcon={<AppIcon name="search" size={18} />}
            size="large"
            type="submit"
            variant="primary"
          >
            Search
          </Button>
        </form>
        <p className="vocabulary-hero__hint">Exact match, forms, aliases, and suggestions</p>
      </section>

      <div className="vocabulary-dashboard">
        <WordListCard eyebrow="Recent" title="Recent searches" words={RECENT_WORDS} />
        <WordListCard eyebrow="Added locally" title="Recent additions" words={RECENT_ADDITIONS} />
      </div>
    </div>
  );
}
