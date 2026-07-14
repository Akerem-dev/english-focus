import { useLocation } from "react-router-dom";

import { Button } from "../../components";
import { AppIcon } from "../../design-system";
import { getRouteByPath } from "../router";

export function AppTopBar() {
  const location = useLocation();
  const route = getRouteByPath(location.pathname);

  return (
    <header className="app-topbar">
      <span className="app-topbar__route">{route.title}</span>
      <div className="app-topbar__actions">
        <Button
          disabled
          leadingIcon={<AppIcon name="upload" size={17} />}
          size="small"
          title="Import workflow arrives in a later checkpoint"
          variant="secondary"
        >
          Import
        </Button>
        <button
          aria-label="Command bar arrives in a later checkpoint"
          className="app-topbar__keycap"
          disabled
          title="Command bar arrives in a later checkpoint"
          type="button"
        >
          Ctrl+K
        </button>
      </div>
    </header>
  );
}
