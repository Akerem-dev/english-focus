import { Link, NavLink, useLocation } from "react-router-dom";

import { SidebarNavItem } from "../../components/navigation";
import { AppIcon, type AppIconName } from "../../design-system";
import { dispatchAppCommand } from "../command-bar";
import { APP_ROUTES } from "../router/routes";
import { ROUTE_PATHS } from "../router/routeIds";

interface FinalSidebarItem {
  readonly label: string;
  readonly icon: AppIconName;
  readonly to?: string;
  readonly end?: boolean;
}

const FINAL_SIDEBAR_ITEMS: readonly FinalSidebarItem[] = Object.freeze([
  { label: "Search", icon: "search", to: ROUTE_PATHS.vocabulary, end: true },
  { label: "Grammar", icon: "book-open" },
  { label: "Collections", icon: "bookmark", to: ROUTE_PATHS.library },
  { label: "Practice", icon: "edit" },
  { label: "Favorites", icon: "star" },
  { label: "Settings", icon: "settings", to: ROUTE_PATHS.settings }
]);

function FinalWordValleySidebar() {
  return (
    <aside className="app-sidebar app-sidebar--word-valley-final wv84-sidebar">
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
              aria-label="Daily goal progress: 72 percent"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={72}
              className="wv84-progress__ring"
              role="progressbar"
            >
              <span>72%</span>
            </div>
            <div className="wv84-progress__goal-copy">
              <strong>12 / 16</strong>
              <span>words learned</span>
            </div>
          </div>
          <div className="wv84-progress__rule" />
          <div className="wv84-progress__metric">
            <AppIcon name="bookmark" size={24} />
            <div>
              <strong>1,147</strong>
              <span>Collected words</span>
            </div>
          </div>
          <div className="wv84-progress__metric wv84-progress__metric--days">
            <AppIcon name="star" size={22} />
            <strong>12 days</strong>
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
