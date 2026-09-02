import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AssistantDock, GrammarAssistantDock } from "../../modules/assistant";
import { SearchCleanShell } from "../../modules/search-rebuild/SearchCleanShell";
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

const WORD_VALLEY_STAGE_WIDTH = 1664;
const WORD_VALLEY_STAGE_HEIGHT = 936;
const WORD_VALLEY_MIN_SCALE = 0.45;
const SEARCH_WORDIE_SINGLE_ENTRY_STYLE =
  ".word-valley-stage .assistant-dock:not(.wvg-wordie-dock) .wv84-assistant-launcher,.word-valley-stage .assistant-dock:not(.wvg-wordie-dock) .wv84-assistant__ready-mascot{display:none!important}";

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
  const isWordValleySearch = location.pathname === ROUTE_PATHS.vocabulary;
  const isWordValleyGrammar = location.pathname === ROUTE_PATHS.grammar;
  const isWordValleyCollections = location.pathname === ROUTE_PATHS.library;
  const isWordValleyCleanRoom =
    isWordValleySearch || isWordValleyGrammar || isWordValleyCollections;

  useEffect(() => {
    if (!isWordValleyCleanRoom) return;

    const viewport = wordValleyViewportRef.current;
    if (viewport === null) return;

    let animationFrame = 0;

    const updateScale = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const viewportWidth = Math.max(window.innerWidth, 1);
        const viewportHeight = Math.max(window.innerHeight, 1);
        const scale = Math.max(
          Math.min(
            viewportWidth / WORD_VALLEY_STAGE_WIDTH,
            viewportHeight / WORD_VALLEY_STAGE_HEIGHT
          ),
          WORD_VALLEY_MIN_SCALE
        );

        viewport.style.setProperty("--wv-stage-scale-x", String(scale));
        viewport.style.setProperty("--wv-stage-scale-y", String(scale));
      });
    };

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateScale);
    };
  }, [isWordValleyCleanRoom]);

  function openVocabularyHome() {
    if (location.pathname === ROUTE_PATHS.vocabulary) {
      dispatchAppCommand("open-vocabulary-home");
      return;
    }

    navigate(ROUTE_PATHS.vocabulary);
  }

  function focusCurrentSearch() {
    if (location.pathname === ROUTE_PATHS.library || location.pathname === ROUTE_PATHS.vocabulary) {
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

  if (isWordValleyCleanRoom) {
    return (
      <div
        className={`application-frame application-frame--search-cleanroom${
          isWordValleyCollections ? " application-frame--collections-cleanroom" : ""
        }`}
      >
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>

        <div className="word-valley-stage-viewport" ref={wordValleyViewportRef}>
          <div className="word-valley-stage">
            {isWordValleySearch ? <style>{SEARCH_WORDIE_SINGLE_ENTRY_STYLE}</style> : null}
            <SearchCleanShell>
              <RouteAccessibilityManager />
              {isWordValleyGrammar ? (
                <div className="application-frame--grammar-cleanroom grammar-route-scope">
                  {children}
                </div>
              ) : (
                children
              )}
            </SearchCleanShell>
            {isWordValleySearch ? <AssistantDock /> : null}
            {isWordValleyGrammar ? <GrammarAssistantDock /> : null}
          </div>
        </div>

        <AppTopBar headless onOpenCommandBar={commandBar.openCommandBar} />
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
      <AssistantDock />

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
