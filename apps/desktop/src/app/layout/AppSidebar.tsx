import { useMemo, type CSSProperties } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import type { ActivityRecord } from "@platform/domain";

import { SidebarNavItem } from "../../components/navigation";
import { AppIcon, type AppIconName } from "../../design-system";
import { useActivity, useVocabularyRepository } from "../providers";
import { dispatchAppCommand } from "../command-bar";
import { APP_ROUTES } from "../router/routes";
import { ROUTE_PATHS } from "../router/routeIds";

interface FinalSidebarItem {
  readonly label: string;
  readonly icon: AppIconName;
  readonly to?: string;
  readonly end?: boolean;
}

const DAILY_WORD_GOAL = 16;
const FINAL_SIDEBAR_ITEMS: readonly FinalSidebarItem[] = Object.freeze([
  { label: "Search", icon: "search", to: ROUTE_PATHS.vocabulary, end: true },
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

function vocabularyActivity(record: ActivityRecord): boolean {
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
      .filter(vocabularyActivity)
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

function FinalWordValleySidebar() {
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

    return Object.freeze({
      wordsExploredToday,
      collectedWords,
      consecutiveDays,
      percentage
    });
  }, [activity, contentSource]);

  const loading = activityStatus === "loading" || vocabularyStatus === "loading";
  const progressStyle = {
    "--wv84-progress": `${progress.percentage}%`
  } as CSSProperties;

  return (
    <aside className="app-sidebar app-sidebar--word-valley-final wv84-sidebar">
      <span className="visually-hidden">Your Wordbook</span>
      <nav aria-label="Primary navigation" className="wv84-sidebar__nav">
        {FINAL_SIDEBAR_ITEMS.map((item) =>
          item.to === undefined ? (
            <button
              aria-disabled="true"
              className="wv84-nav-item wv84-nav-item--unavailable"
              disabled
              key={item.label}
              title={`${item.label} — coming soon`}
              type="button"
            >
              <AppIcon name={item.icon} size={26} />
              <span>{item.label}</span>
            </button>
          ) : (
            <NavLink
              aria-label={item.to === ROUTE_PATHS.library ? "Library" : item.label}
              className={({ isActive }) =>
                `wv84-nav-item${isActive ? " wv84-nav-item--active" : ""}`
              }
              end={item.end ?? false}
              key={item.label}
              title={item.label}
              to={item.to}
            >
              <AppIcon name={item.icon} size={26} />
              <span>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>

      <div aria-hidden="true" className="wv84-sidebar__divider">
        <span />
      </div>

      <section aria-label="Your progress" className="wv84-progress">
        <p className="wv84-progress__eyebrow">YOUR PROGRESS</p>
        <div className="wv84-progress__card">
          <p className="wv84-progress__label">Daily goal</p>
          <div className="wv84-progress__goal-row">
            <div
              aria-label={`Daily goal progress: ${progress.percentage} percent`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={progress.percentage}
              className="wv84-progress__ring"
              role="progressbar"
              style={progressStyle}
            >
              <span>{loading ? "—" : `${progress.percentage}%`}</span>
            </div>
            <div className="wv84-progress__goal-copy">
              <strong>
                {loading ? "—" : progress.wordsExploredToday} / {DAILY_WORD_GOAL}
              </strong>
              <span>words explored</span>
            </div>
          </div>
          <div className="wv84-progress__rule" />
          <div className="wv84-progress__metric">
            <AppIcon name="bookmark" size={24} />
            <div>
              <strong>{loading ? "—" : progress.collectedWords.toLocaleString()}</strong>
              <span>Collected words</span>
            </div>
          </div>
          <div className="wv84-progress__metric wv84-progress__metric--days">
            <AppIcon name="star" size={22} />
            <strong>
              {loading
                ? "Loading…"
                : `${progress.consecutiveDays} ${progress.consecutiveDays === 1 ? "day" : "days"}`}
            </strong>
          </div>
        </div>
      </section>
    </aside>
  );
}

function StandardSidebar() {
  return (
    <aside className="app-sidebar">
      <Link
        aria-label="Word Valley wordbook home"
        className="app-sidebar__brand"
        onClick={() => {
          dispatchAppCommand("open-vocabulary-home");
        }}
        to={ROUTE_PATHS.vocabulary}
      >
        <span aria-hidden="true" className="app-sidebar__brand-mascot" />
        <span className="app-sidebar__brand-name" aria-hidden="true">
          <span>Word</span>
          <span>Valley</span>
        </span>
      </Link>

      <nav aria-label="Primary navigation" className="app-sidebar__nav">
        {APP_ROUTES.map((route) => (
          <SidebarNavItem
            end={route.id === "vocabulary"}
            icon={<AppIcon name={route.icon} size={23} />}
            key={route.id}
            label={route.label}
            to={route.path}
          />
        ))}
      </nav>
    </aside>
  );
}

export function AppSidebar() {
  const location = useLocation();

  return location.pathname === ROUTE_PATHS.vocabulary ? (
    <FinalWordValleySidebar />
  ) : (
    <StandardSidebar />
  );
}
