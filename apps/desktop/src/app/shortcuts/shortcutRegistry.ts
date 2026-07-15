export interface KeyboardShortcutDefinition {
  readonly id: string;
  readonly keys: readonly string[];
  readonly label: string;
  readonly description: string;
  readonly group: "Navigation" | "Actions" | "Interface";
}

export const KEYBOARD_SHORTCUTS: readonly KeyboardShortcutDefinition[] = [
  {
    id: "command-bar",
    keys: ["Ctrl", "K"],
    label: "Open command bar",
    description: "Search routes and local actions without leaving the keyboard.",
    group: "Interface"
  },
  {
    id: "library",
    keys: ["Ctrl", "L"],
    label: "Open Library",
    description: "Navigate directly to the saved vocabulary Library.",
    group: "Navigation"
  },
  {
    id: "settings",
    keys: ["Ctrl", ","],
    label: "Open Settings",
    description: "Navigate directly to application preferences.",
    group: "Navigation"
  },
  {
    id: "import",
    keys: ["Ctrl", "I"],
    label: "Import vocabulary",
    description: "Open the local single-entry or vocabulary-pack import chooser.",
    group: "Actions"
  },
  {
    id: "export",
    keys: ["Ctrl", "E"],
    label: "Export current context",
    description: "Export the open vocabulary entry or the current Library selection.",
    group: "Actions"
  },
  {
    id: "save",
    keys: ["Ctrl", "S"],
    label: "Favorite or save",
    description: "Favorite the open vocabulary entry; save an open study-details dialog.",
    group: "Actions"
  },
  {
    id: "focus-search",
    keys: ["/"],
    label: "Focus search",
    description: "Focus the active Library search or return to Vocabulary search.",
    group: "Navigation"
  },
  {
    id: "shortcut-help",
    keys: ["?"],
    label: "Show keyboard shortcuts",
    description: "Open this shortcut reference dialog.",
    group: "Interface"
  },
  {
    id: "close-overlay",
    keys: ["Esc"],
    label: "Close overlay",
    description: "Close the command bar, dialog, or active modal without changing data.",
    group: "Interface"
  }
];
