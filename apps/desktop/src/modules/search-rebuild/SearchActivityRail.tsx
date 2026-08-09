import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "../../app/router";
import sparklePair from "../../assets/decorative/accent-sparkle-pair.png";
import wordieReading from "../../assets/wordie/wordie-cutout-reading.png";
import { AppIcon } from "../../design-system";
import { dispatchAssistantRequest } from "../assistant";

export interface SearchActivityRailItem {
  readonly word: string;
  readonly normalizedWord: string;
  readonly occurredAt: string;
}

interface SearchActivityRailProps {
  readonly recentSearches: readonly SearchActivityRailItem[];
  readonly recentAdditions: readonly SearchActivityRailItem[];
  readonly onOpenWord: (normalizedWord: string) => void;
  readonly className?: string | undefined;
}

function formatRelativeTime(value: string): string {
  const occurredAt = new Date(value);
  const elapsedMs = Date.now() - occurredAt.getTime();

  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return "Recently";
  }

  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(occurredAt);
}

interface ActivityListProps {
  readonly title: string;
  readonly items: readonly SearchActivityRailItem[];
  readonly kind: "viewed" | "added";
  readonly onOpenWord: (normalizedWord: string) => void;
}

function ActivityList({ items, kind, onOpenWord, title }: ActivityListProps) {
  return (
    <section className="wvsr-activity" aria-label={title}>
      <header className="wvsr-activity__header">
        <span className="wvsr-activity__header-icon" aria-hidden="true">
          <AppIcon name={kind === "viewed" ? "search" : "bookmark"} size={22} />
        </span>
        <h2>{title}</h2>
        <Link className="wvsr-activity__view-all" to={ROUTE_PATHS.library}>
          View all
        </Link>
      </header>

      <div className="wvsr-activity__rows">
        {items.slice(0, 5).map((item) => (
          <button
            className="wvsr-activity__row"
            key={`${kind}-${item.normalizedWord}`}
            onClick={() => onOpenWord(item.normalizedWord)}
            type="button"
          >
            <span className="wvsr-activity__row-icon" aria-hidden="true">
              <AppIcon name={kind === "viewed" ? "bookmark" : "book-open"} size={18} />
            </span>
            <span className="wvsr-activity__word">{item.word}</span>
            <span className="wvsr-activity__time">{formatRelativeTime(item.occurredAt)}</span>
          </button>
        ))}

        {items.length === 0 ? (
          <p className="wvsr-activity__empty">
            {kind === "viewed" ? "Words you open will appear here." : "Saved words will appear here."}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function SearchActivityRail({
  className,
  onOpenWord,
  recentAdditions,
  recentSearches
}: SearchActivityRailProps) {
  return (
    <aside className={["wvsr-rail", className].filter(Boolean).join(" ")} aria-label="Word activity">
      <div className="wvsr-rail__paper" aria-hidden="true" />
      <ActivityList
        kind="viewed"
        items={recentSearches}
        onOpenWord={onOpenWord}
        title="RECENTLY VIEWED"
      />
      <div className="wvsr-rail__divider" />
      <ActivityList
        kind="added"
        items={recentAdditions}
        onOpenWord={onOpenWord}
        title="RECENT ADDITIONS"
      />

      <section className="wvsr-wordie-card" aria-label="Wordie vocabulary assistant">
        <header>
          <span className="wvsr-wordie-card__status" aria-hidden="true">✓</span>
          <h2>Wordie</h2>
          <img alt="" className="wvsr-wordie-card__sparkle" src={sparklePair} />
        </header>
        <p className="wvsr-wordie-card__subtitle">Your vocabulary companion</p>
        <p className="wvsr-wordie-card__copy">
          Need help finding the right word or understanding its nuance?
        </p>
        <img alt="" className="wvsr-wordie-card__mascot" src={wordieReading} />
        <button onClick={() => dispatchAssistantRequest({ kind: "open" })} type="button">
          <span>Ask Wordie</span>
          <span aria-hidden="true">→</span>
        </button>
      </section>
    </aside>
  );
}
