import { Link, NavLink, useLocation } from "react-router-dom";

import wordValleyLogo from "../../assets/shell/word-valley-logo.png";
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
    <aside className="app-sidebar app-sidebar--word-valley-final">
      <Link
        aria-label="Word Valley search home"
        className="app-sidebar__brand"
        onClick={() => {
          dispatchAppCommand("open-vocabulary-home");
        }}
        to={ROUTE_PATHS.vocabulary}
      >
        <img alt="Word Valley" className="app-sidebar__brand-final-logo" src={wordValleyLogo} />
      </Link>

      <nav aria-label="Primary navigation" className="app-sidebar__nav">
        {FINAL_SIDEBAR_ITEMS.map((item) =>
          item.to === undefined ? (
            <button
              aria-disabled="true"
              className="sidebar-nav-item sidebar-nav-item--unavailable"
              disabled
              key={item.label}
              title={`${item.label} — coming soon`}
              type="button"
            >
              <span aria-hidden="true" className="sidebar-nav-item__icon">
                <AppIcon name={item.icon} size={26} />
              </span>
              <span className="sidebar-nav-item__label">{item.label}</span>
            </button>
          ) : (
            <NavLink
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? " sidebar-nav-item--active" : ""}`
              }
              end={item.end ?? false}
              key={item.label}
              title={item.label}
              to={item.to}
            >
              <span aria-hidden="true" className="sidebar-nav-item__icon">
                <AppIcon name={item.icon} size={26} />
              </span>
              <span className="sidebar-nav-item__label">{item.label}</span>
            </NavLink>
          )
        )}
      </nav>

      <section aria-label="Your progress" className="word-valley-progress">
        <p className="word-valley-progress__eyebrow">YOUR PROGRESS</p>
        <div className="word-valley-progress__streak">
          <strong>12</strong>
          <span>day streak</span>
        </div>
        <div aria-label="Six of seven days complete" className="word-valley-progress__days">
          {Array.from({ length: 7 }, (_, index) => (
            <span data-complete={index < 6 || undefined} key={index} />
          ))}
        </div>
        <div className="word-valley-progress__divider" />
        <p className="word-valley-progress__collected">147 words collected</p>
        <div
          aria-label="Collection progress: 29 percent"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={29}
          className="word-valley-progress__bar"
          role="progressbar"
        >
          <span />
        </div>
        <span className="word-valley-progress__percent">29%</span>
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
