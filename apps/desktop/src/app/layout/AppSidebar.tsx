import { Link } from "react-router-dom";

import wordValleyBrandMascot from "../../assets/brand/word-valley-brand-mascot.png";
import { SidebarNavItem } from "../../components/navigation";
import { AppIcon } from "../../design-system";
import { dispatchAppCommand } from "../command-bar";
import { APP_ROUTES } from "../router/routes";
import { ROUTE_PATHS } from "../router/routeIds";

export function AppSidebar() {
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
        <img alt="" className="app-sidebar__brand-mascot" src={wordValleyBrandMascot} />
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
