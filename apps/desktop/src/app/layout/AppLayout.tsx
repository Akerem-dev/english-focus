import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AssistantDock } from "../../modules/assistant";
import {
  CommandBar,
  createCommandRegistry,
  dispatchAppCommand,
  useCommandBar,
  type AppCommandAction,
  type CommandDefinition
} from "../command-bar";
import { RouteAccessibilityManager } from "../performance/RouteAccessibilityManager";
import { ROUTE_PATHS } from "../router/routeIds";
import { KeyboardShortcutsDialog, useGlobalShortcuts } from "../shortcuts";
import { AppContent } from "./AppContent";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";

const WORD_VALLEY_STAGE_WIDTH = 1920;
const WORD_VALLEY_STAGE_HEIGHT = 1080;

function hasAction(commands: readonly CommandDefinition[], action: AppCommandAction): boolean {
  return commands.some(
    (command) => command.target.kind === "action" && command.target.action === action
  );
}

export function AppLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const commandBar = useCommandBar();
  const wordValleyViewportRef = useRef<HTMLDivElement>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const commands = useMemo(() => createCommandRegistry(location.pathname), [location.pathname]);
  const canExportCurrent = hasAction(commands, "export-current");
  const canSaveCurrent = hasAction(commands, "save-current");
  const isWordValleyRoute = location.pathname === ROUTE_PATHS.vocabulary;

  useEffect(() => {
    if (!isWordValleyRoute) {
      return;
    }

    const viewport = wordValleyViewportRef.current;
    if (viewport === null) {
      return;
    }

    const updateScale = () => {
      const bounds = viewport.getBoundingClientRect();
      const scale = Math.min(
        bounds.width / WORD_VALLEY_STAGE_WIDTH,
        bounds.height / WORD_VALLEY_STAGE_HEIGHT
      );

      viewport.style.setProperty("--wv-stage-scale", String(Math.max(scale, 0.01)));
    };

    updateScale();
    window.addEventListener("resize", updateScale);

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(updateScale);
    resizeObserver?.observe(viewport);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [isWordValleyRoute]);

  function openVocabularyHome() {
    if (location.pathname === ROUTE_PATHS.vocabulary) {
      dispatchAppCommand("open-vocabulary-home");
      return;
    }

    navigate(ROUTE_PATHS.vocabulary);
  }

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
        if (command.target.path === ROUTE_PATHS.vocabulary) {
          openVocabularyHome();
          return;
        }

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
    canExportCurrent,
    canSaveCurrent,
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

  const applicationShell = (
    <>
      <AppSidebar />
      <div className="application-main">
        <RouteAccessibilityManager />
        <AppTopBar onOpenCommandBar={commandBar.openCommandBar} />
        <AppContent>{children}</AppContent>
      </div>
      <AssistantDock />
    </>
  );

  return (
    <div
      className={`application-frame${isWordValleyRoute ? " application-frame--word-valley-stage" : ""}`}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      {isWordValleyRoute ? (
        <div className="word-valley-stage-viewport" ref={wordValleyViewportRef}>
          <div className="word-valley-stage">{applicationShell}</div>
        </div>
      ) : (
        applicationShell
      )}

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
