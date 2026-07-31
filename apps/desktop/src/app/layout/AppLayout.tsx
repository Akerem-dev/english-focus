import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import wordValleyBackgroundLoop from "../../assets/word-valley-final/background/home-background-loop.mp4";
import wordValleyBackgroundStatic from "../../assets/word-valley-final/background/home-background-static.png";
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
const WORD_VALLEY_MOTION_STORAGE_KEYS = Object.freeze([
  "english-focus:reduce-motion",
  "word-valley:reduce-motion"
]);

function hasAction(commands: readonly CommandDefinition[], action: AppCommandAction): boolean {
  return commands.some(
    (command) => command.target.kind === "action" && command.target.action === action
  );
}

function readReducedMotionPreference(mediaQuery: MediaQueryList): boolean {
  const root = document.documentElement;
  const appPreference =
    root.dataset.reduceMotion === "true" ||
    root.dataset.motion === "reduced" ||
    root.dataset.animations === "off";
  const storedPreference = WORD_VALLEY_MOTION_STORAGE_KEYS.some(
    (key) => window.localStorage.getItem(key) === "true"
  );

  return mediaQuery.matches || appPreference || storedPreference;
}

function WordValleyBackdrop() {
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setReduceMotion(readReducedMotionPreference(mediaQuery));
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    const observer = new MutationObserver(updatePreference);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-reduce-motion", "data-motion", "data-animations"]
    });

    window.addEventListener("storage", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
      observer.disconnect();
      window.removeEventListener("storage", updatePreference);
    };
  }, []);

  return (
    <div aria-hidden="true" className="word-valley-backdrop">
      <img
        alt=""
        className="word-valley-backdrop__static"
        src={wordValleyBackgroundStatic}
      />
      {reduceMotion ? null : (
        <video
          autoPlay
          className="word-valley-backdrop__video"
          loop
          muted
          playsInline
          poster={wordValleyBackgroundStatic}
          preload="metadata"
        >
          <source src={wordValleyBackgroundLoop} type="video/mp4" />
        </video>
      )}
    </div>
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
  const isWordValleyLibrary = location.pathname === ROUTE_PATHS.library;
  const isWordValleyRoute = isWordValleySearch || isWordValleyLibrary;

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
      const scaleX = Math.max(bounds.width / WORD_VALLEY_STAGE_WIDTH, 0.01);
      const scaleY = Math.max(bounds.height / WORD_VALLEY_STAGE_HEIGHT, 0.01);

      viewport.style.setProperty("--wv-stage-scale-x", String(scaleX));
      viewport.style.setProperty("--wv-stage-scale-y", String(scaleY));
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
      className={`application-frame${isWordValleyRoute ? " application-frame--word-valley-stage" : ""}${isWordValleyLibrary ? " application-frame--word-valley-library" : ""}${isWordValleySearch ? " application-frame--word-valley-final-search" : ""}`}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      {isWordValleyRoute ? (
        <div className="word-valley-stage-viewport" ref={wordValleyViewportRef}>
          <div className="word-valley-stage">
            {isWordValleySearch ? <WordValleyBackdrop /> : null}
            {applicationShell}
          </div>
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
