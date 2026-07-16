import { useMemo, useState, type PropsWithChildren } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  CommandBar,
  createCommandRegistry,
  dispatchAppCommand,
  useCommandBar,
  type CommandDefinition
} from "../command-bar";
import { ROUTE_PATHS } from "../router";
import { RouteAccessibilityManager } from "../performance";
import { KeyboardShortcutsDialog, useGlobalShortcuts } from "../shortcuts";
import { AppContent } from "./AppContent";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";

export function AppLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const commandBar = useCommandBar();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const commands = useMemo(() => createCommandRegistry(location.pathname), [location.pathname]);

  function focusCurrentSearch() {
    if (location.pathname === ROUTE_PATHS.library) {
      dispatchAppCommand("focus-search");
      return;
    }

    if (location.pathname === ROUTE_PATHS.vocabulary) {
      dispatchAppCommand("focus-search");
      return;
    }

    navigate(ROUTE_PATHS.vocabulary);
    window.setTimeout(() => {
      dispatchAppCommand("focus-search");
    }, 0);
  }

  function executeCommand(command: CommandDefinition) {
    switch (command.target.kind) {
      case "navigate":
        navigate(command.target.path);
        return;
      case "action":
        if (command.target.action === "focus-search") {
          focusCurrentSearch();
          return;
        }

        dispatchAppCommand(command.target.action);
        return;
      case "shortcuts":
        setShortcutsOpen(true);
    }
  }

  useGlobalShortcuts({
    onFocusSearch: focusCurrentSearch,
    onNavigateLibrary: () => {
      navigate(ROUTE_PATHS.library);
    },
    onNavigateSettings: () => {
      navigate(ROUTE_PATHS.settings);
    },
    onOpenCommandBar: commandBar.openCommandBar,
    onOpenShortcuts: () => {
      setShortcutsOpen(true);
    }
  });

  return (
    <div className="application-frame">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <AppSidebar />
      <div className="application-main">
        <RouteAccessibilityManager />
        <AppTopBar onOpenCommandBar={commandBar.openCommandBar} />
        <AppContent>{children}</AppContent>
      </div>

      <CommandBar
        commands={commands}
        onClose={commandBar.closeCommandBar}
        onExecute={executeCommand}
        open={commandBar.open}
      />
      <KeyboardShortcutsDialog
        onClose={() => {
          setShortcutsOpen(false);
        }}
        open={shortcutsOpen}
      />
    </div>
  );
}
