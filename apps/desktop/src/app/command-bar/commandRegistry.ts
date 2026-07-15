import type { AppIconName } from "../../design-system";
import { ROUTE_PATHS } from "../router";

export type AppCommandAction =
  | "edit-study-details"
  | "export-current"
  | "focus-search"
  | "open-import"
  | "save-current";

export type CommandCategory = "Navigation" | "Actions" | "Help";

export type CommandTarget =
  | { readonly kind: "navigate"; readonly path: string }
  | { readonly kind: "action"; readonly action: AppCommandAction }
  | { readonly kind: "shortcuts" };

export interface CommandDefinition {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly category: CommandCategory;
  readonly icon: AppIconName;
  readonly keywords: readonly string[];
  readonly shortcut?: string;
  readonly target: CommandTarget;
}

export const APP_COMMAND_EVENT = "english-focus:app-command";

export interface AppCommandEventDetail {
  readonly action: AppCommandAction;
}

export function dispatchAppCommand(action: AppCommandAction): void {
  window.dispatchEvent(
    new CustomEvent<AppCommandEventDetail>(APP_COMMAND_EVENT, {
      detail: { action }
    })
  );
}

export function createCommandRegistry(pathname: string): readonly CommandDefinition[] {
  const routeCommands: readonly CommandDefinition[] = [
    {
      id: "navigate-vocabulary",
      label: "Open Vocabulary",
      description: "Search or review a local English vocabulary entry.",
      category: "Navigation",
      icon: "book-open",
      keywords: ["vocabulary", "word", "search", "dictionary"],
      target: { kind: "navigate", path: ROUTE_PATHS.vocabulary }
    },
    {
      id: "navigate-library",
      label: "Open Library",
      description: "Browse, filter, select, and export saved vocabulary.",
      category: "Navigation",
      icon: "books",
      keywords: ["library", "saved", "collection", "words"],
      shortcut: "Ctrl+L",
      target: { kind: "navigate", path: ROUTE_PATHS.library }
    },
    {
      id: "navigate-settings",
      label: "Open Settings",
      description: "Adjust content, appearance, backup, and diagnostics preferences.",
      category: "Navigation",
      icon: "settings",
      keywords: ["settings", "preferences", "appearance", "backup"],
      shortcut: "Ctrl+,",
      target: { kind: "navigate", path: ROUTE_PATHS.settings }
    }
  ];

  const sharedActions: readonly CommandDefinition[] = [
    {
      id: "focus-search",
      label: pathname === ROUTE_PATHS.library ? "Focus library search" : "Focus vocabulary search",
      description:
        pathname === ROUTE_PATHS.library
          ? "Move keyboard focus to the Library search field."
          : "Open Vocabulary and move keyboard focus to its search field.",
      category: "Actions",
      icon: "search",
      keywords: ["focus", "search", "find", "slash"],
      shortcut: "/",
      target: { kind: "action", action: "focus-search" }
    },
    {
      id: "open-import",
      label: "Import vocabulary",
      description: "Import one entry or a versioned vocabulary pack from this device.",
      category: "Actions",
      icon: "upload",
      keywords: ["import", "json", "pack", "file"],
      shortcut: "Ctrl+I",
      target: { kind: "action", action: "open-import" }
    }
  ];

  const routeActions: CommandDefinition[] = [];

  if (pathname === ROUTE_PATHS.vocabulary) {
    routeActions.push(
      {
        id: "export-current-vocabulary",
        label: "Export current vocabulary entry",
        description: "Export the currently open entry as a versioned JSON file.",
        category: "Actions",
        icon: "download",
        keywords: ["export", "download", "json", "current word"],
        shortcut: "Ctrl+E",
        target: { kind: "action", action: "export-current" }
      },
      {
        id: "save-current-vocabulary",
        label: "Favorite current vocabulary entry",
        description: "Toggle the favorite state for the currently open entry.",
        category: "Actions",
        icon: "star",
        keywords: ["save", "favorite", "star", "study"],
        shortcut: "Ctrl+S",
        target: { kind: "action", action: "save-current" }
      },
      {
        id: "edit-study-details",
        label: "Edit study details",
        description: "Open tags, notes, learning status, and review status.",
        category: "Actions",
        icon: "settings",
        keywords: ["study", "metadata", "tags", "note", "learning"],
        target: { kind: "action", action: "edit-study-details" }
      }
    );
  }

  if (pathname === ROUTE_PATHS.library) {
    routeActions.push({
      id: "export-library",
      label: "Export Library selection",
      description: "Export selected entries, or the full Library when nothing is selected.",
      category: "Actions",
      icon: "download",
      keywords: ["export", "library", "selected", "pack"],
      shortcut: "Ctrl+E",
      target: { kind: "action", action: "export-current" }
    });
  }

  const helpCommands: readonly CommandDefinition[] = [
    {
      id: "show-keyboard-shortcuts",
      label: "Show keyboard shortcuts",
      description: "Review every global keyboard command available in English Focus.",
      category: "Help",
      icon: "command",
      keywords: ["keyboard", "shortcuts", "help", "keys"],
      shortcut: "?",
      target: { kind: "shortcuts" }
    }
  ];

  return [...routeCommands, ...sharedActions, ...routeActions, ...helpCommands];
}
