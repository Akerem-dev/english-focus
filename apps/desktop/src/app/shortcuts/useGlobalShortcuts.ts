import { useEffect } from "react";

import { dispatchAppCommand } from "../command-bar";

export interface GlobalShortcutHandlers {
  readonly onOpenCommandBar: () => void;
  readonly onOpenShortcuts: () => void;
  readonly onNavigateLibrary: () => void;
  readonly onNavigateSettings: () => void;
  readonly onFocusSearch: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

function modalIsOpen(): boolean {
  return document.querySelector('[role="dialog"][aria-modal="true"]') !== null;
}

export function useGlobalShortcuts({
  onFocusSearch,
  onNavigateLibrary,
  onNavigateSettings,
  onOpenCommandBar,
  onOpenShortcuts
}: GlobalShortcutHandlers): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey) {
        return;
      }

      if (modalIsOpen()) {
        return;
      }

      const key = event.key.toLocaleLowerCase("en-US");
      const modifier = event.ctrlKey || event.metaKey;

      if (modifier && key === "k") {
        event.preventDefault();
        event.stopPropagation();
        onOpenCommandBar();
        return;
      }

      if (modifier && key === "l") {
        event.preventDefault();
        event.stopPropagation();
        onNavigateLibrary();
        return;
      }

      if (modifier && event.key === ",") {
        event.preventDefault();
        event.stopPropagation();
        onNavigateSettings();
        return;
      }

      if (modifier && key === "i") {
        event.preventDefault();
        event.stopPropagation();
        dispatchAppCommand("open-import");
        return;
      }

      if (modifier && key === "e") {
        event.preventDefault();
        event.stopPropagation();
        dispatchAppCommand("export-current");
        return;
      }

      if (modifier && key === "s" && !isEditableTarget(event.target)) {
        event.preventDefault();
        event.stopPropagation();
        dispatchAppCommand("save-current");
        return;
      }

      if (!modifier && event.key === "/" && !isEditableTarget(event.target)) {
        event.preventDefault();
        event.stopPropagation();
        onFocusSearch();
        return;
      }

      if (!modifier && event.key === "?" && !isEditableTarget(event.target)) {
        event.preventDefault();
        event.stopPropagation();
        onOpenShortcuts();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [
    onFocusSearch,
    onNavigateLibrary,
    onNavigateSettings,
    onOpenCommandBar,
    onOpenShortcuts
  ]);
}
