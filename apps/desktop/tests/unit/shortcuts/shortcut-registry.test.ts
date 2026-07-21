import { describe, expect, it } from "vitest";

import { createCommandRegistry, type AppCommandAction } from "../../../src/app/command-bar";
import { KEYBOARD_SHORTCUTS } from "../../../src/app/shortcuts";

function supportsAction(pathname: string, action: AppCommandAction): boolean {
  return createCommandRegistry(pathname).some(
    (command) => command.target.kind === "action" && command.target.action === action
  );
}

describe("keyboard shortcut registry", () => {
  it("contains every approved global shortcut exactly once", () => {
    expect(KEYBOARD_SHORTCUTS.map((shortcut) => shortcut.id)).toEqual([
      "command-bar",
      "library",
      "settings",
      "import",
      "export",
      "save",
      "focus-search",
      "shortcut-help",
      "close-overlay"
    ]);
  });

  it("builds route-aware command collections without adding new primary routes", () => {
    const vocabularyCommands = createCommandRegistry("/");
    const libraryCommands = createCommandRegistry("/library");
    const settingsCommands = createCommandRegistry("/settings");

    expect(vocabularyCommands.some((command) => command.id === "save-current-vocabulary")).toBe(
      true
    );
    expect(libraryCommands.some((command) => command.id === "export-library")).toBe(true);
    expect(settingsCommands.some((command) => command.id === "export-library")).toBe(false);
    expect(settingsCommands.filter((command) => command.target.kind === "navigate")).toHaveLength(
      3
    );
  });

  it("exposes export and save only on routes that can handle them", () => {
    expect(supportsAction("/", "export-current")).toBe(true);
    expect(supportsAction("/", "save-current")).toBe(true);

    expect(supportsAction("/library", "export-current")).toBe(true);
    expect(supportsAction("/library", "save-current")).toBe(false);

    expect(supportsAction("/settings", "export-current")).toBe(false);
    expect(supportsAction("/settings", "save-current")).toBe(false);
  });
});
