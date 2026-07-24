import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { SidebarNavItem } from "../../components/navigation";
import { AppIcon, EnglishFocusMark } from "../../design-system";
import { dispatchAppCommand } from "../command-bar";
import { APP_ROUTES } from "../router/routes";
import { ROUTE_PATHS } from "../router/routeIds";
import { connectToRuntime, type RuntimeConnection } from "../runtime/runtimeBridge";

function runtimeLabel(connection: RuntimeConnection | undefined) {
  if (connection === undefined) {
    return "Checking local runtime";
  }

  switch (connection.kind) {
    case "native":
      return "Local runtime connected";
    case "browser":
      return "Browser preview";
    case "error":
      return "Runtime unavailable";
  }
}

export function AppSidebar() {
  const [runtime, setRuntime] = useState<RuntimeConnection>();

  useEffect(() => {
    let isCurrent = true;

    void connectToRuntime().then((connection) => {
      if (isCurrent) {
        setRuntime(connection);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <aside className="app-sidebar">
      <Link
        aria-label="English Focus vocabulary home"
        className="app-sidebar__brand"
        onClick={() => {
          dispatchAppCommand("open-vocabulary-home");
        }}
        to={ROUTE_PATHS.vocabulary}
      >
        <EnglishFocusMark className="app-sidebar__mark" label="English Focus" size={56} />
        <span className="app-sidebar__brand-name" aria-hidden="true">
          <span>English</span>
          <span>Focus</span>
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

      <div className="app-sidebar__footer">
        <span className="app-sidebar__runtime" data-runtime={runtime?.kind ?? "checking"}>
          <span aria-hidden="true" className="app-sidebar__runtime-dot" />
          <span className="app-sidebar__runtime-copy">{runtimeLabel(runtime)}</span>
        </span>
        <span className="app-sidebar__footer-title">Local Library</span>
        <span className="app-sidebar__language">EN → TR</span>
      </div>
    </aside>
  );
}
