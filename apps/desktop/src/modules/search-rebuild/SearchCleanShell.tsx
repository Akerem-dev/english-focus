import { useMemo, type CSSProperties, type PropsWithChildren } from "react";
import { Link, NavLink } from "react-router-dom";

import type { ActivityRecord } from "@platform/domain";

import brandMark from "../../assets/brand/word-valley-mark.png";
import { AppIcon, type AppIconName } from "../../design-system";
import { useActivity, useVocabularyRepository } from "../../app/providers";
import { ROUTE_PATHS } from "../../app/router";

import "./search-cleanroom.css";

interface CleanNavItem {
  readonly label: string;
  readonly icon: AppIconName;
  readonly to?: string;
}

const DAILY_WORD_GOAL = 25;

const NAV_ITEMS: readonly CleanNavItem[] = Object.freeze([
  { label: "Search", icon: "search", to: ROUTE_PATHS.vocabulary },
  { label: "Grammar", icon: "book-open" },
  { label: "Collections", icon: "bookmark", to: ROUTE_PATHS.library },
  { label: "Practice", icon: "edit" },
  { label: "Favorites", icon: "star" },
  { label: "Settings", icon: "settings", to: ROUTE_PATHS.settings }
]);

function localDayKey(value: string | Date): string | undefined {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function isVocabularyActivity(record: ActivityRecord): boolean {
  return (
    record.target !== undefined &&
    (record.kind === "vocabulary-viewed" ||
      record.kind === "vocabulary-saved" ||
      record.kind === "study-details-saved" ||
      record.kind === "favorite-changed" ||
      record.kind === "entry-kept")
  );
}

function countConsecutiveActivityDays(activity: readonly ActivityRecord[]): number {
  const activeDays = new Set(
    activity
      .filter(isVocabularyActivity)
      .map((record) => localDayKey(record.occurredAt))
      .filter((value): value is string => value !== undefined)
  );

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  const today = localDayKey(cursor);

  if (today !== undefined && !activeDays.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let count = 0;
  while (true) {
    const key = localDayKey(cursor);
    if (key === undefined || !activeDays.has(key)) {
      break;
    }
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return count;
}

function SearchCleanTopBar() {
  return (
    <header className="wvclean-topbar">
      <Link className="wvclean-topbar__brand" to={ROUTE_PATHS.vocabulary}>
        <img alt="" draggable={false} src={brandMark} />
        <span>Word Valley</span>
      </Link>
      <button aria-label="Notifications" className="wvclean-topbar__icon" type="button">
        <AppIcon name="bell" size={18} />
      </button>
    </header>
  );
}

function SearchCleanSidebar() {
  const { activity, status: activityStatus } = useActivity();
  const { contentSource, status: vocabularyStatus } = useVocabularyRepository();

  const progress = useMemo(() => {
    const today = localDayKey(new Date());
    const wordsExploredToday = new Set(
      activity
        .filter((record) => record.kind === "vocabulary-viewed" && record.target !== undefined)
        .filter((record) => localDayKey(record.occurredAt) === today)
        .map((record) => record.target as string)
    ).size;

    const collectedWords = contentSource.listEntries().length;
    const consecutiveDays = countConsecutiveActivityDays(activity);
    const percentage = Math.min(100, Math.round((wordsExploredToday / DAILY_WORD_GOAL) * 100));

    return { collectedWords, consecutiveDays, percentage, wordsExploredToday };
  }, [activity, contentSource]);

  const loading = activityStatus === "loading" || vocabularyStatus === "loading";
  const ringStyle = { "--wvclean-progress": `${progress.percentage}%` } as CSSProperties;

  return (
    <aside className="wvclean-sidebar">
      <Link className="wvclean-sidebar__brand" to={ROUTE_PATHS.vocabulary}>
        <img alt="" draggable={false} src={brandMark} />
        <strong>WORD VALLEY</strong>
        <span>DISCOVER · LEARN · GROW</span>
        <i aria-hidden="true" />
      </Link>

      <nav aria-label="Primary navigation" className="wvclean-nav">
        {NAV_ITEMS.map((item) =>
          item.to === undefined ? (
            <button className="wvclean-nav__item" disabled key={item.label} type="button">
              <AppIcon name={item.icon} size={24} />
              <span>{item.label}</span>
            </button>
          ) : (
            <NavLink
              className={({ isActive }) =>
                `wvclean-nav__item${isActive ? " wvclean-nav__item--active" : ""}`
              }
              end={item.to === ROUTE_PATHS.vocabulary}
              key={item.label}
              to={item.to}
            >
              <AppIcon name={item.icon} size={24} />
              <span>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>

      <div className="wvclean-sidebar__divider" aria-hidden="true" />

      <section aria-label="Your progress" className="wvclean-progress">
        <h2>YOUR PROGRESS</h2>
        <div className="wvclean-progress__card">
          <div className="wvclean-progress__goal">
            <div className="wvclean-progress__ring" style={ringStyle}>
              <span>{loading ? "—" : `${progress.percentage}%`}</span>
            </div>
            <div>
              <strong>{loading ? "—" : progress.wordsExploredToday} / {DAILY_WORD_GOAL}</strong>
              <span>words explored</span>
            </div>
          </div>
          <div className="wvclean-progress__metric">
            <AppIcon name="bookmark" size={22} />
            <div>
              <strong>{loading ? "—" : progress.collectedWords.toLocaleString()}</strong>
              <span>collected words</span>
            </div>
          </div>
          <div className="wvclean-progress__metric">
            <AppIcon name="star" size={21} />
            <div>
              <strong>{loading ? "—" : progress.consecutiveDays}</strong>
              <span>{progress.consecutiveDays === 1 ? "day streak" : "day streak"}</span>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}

export function SearchCleanShell({ children }: PropsWithChildren) {
  return (
    <>
      <SearchCleanTopBar />
      <SearchCleanSidebar />
      <main className="wvclean-main" id="main-content" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
