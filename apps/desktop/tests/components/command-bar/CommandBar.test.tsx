import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CommandBar, createCommandRegistry } from "../../../src/app/command-bar";
import { KeyboardShortcutsDialog } from "../../../src/app/shortcuts";

function renderCommandBar(pathname: string) {
  return renderToStaticMarkup(
    <CommandBar
      commands={createCommandRegistry(pathname)}
      onClose={() => undefined}
      onExecute={() => undefined}
      open
    />
  );
}

describe("CommandBar", () => {
  it("renders navigation, contextual actions, and shortcut help", () => {
    const markup = renderCommandBar("/");

    expect(markup).toContain("Command bar");
    expect(markup).toContain("Open Library");
    expect(markup).toContain("Import vocabulary");
    expect(markup).toContain("Export current vocabulary entry");
    expect(markup).toContain("Favorite current vocabulary entry");
    expect(markup).toContain("Show keyboard shortcuts");
  });

  it("uses Library-specific export copy on the Library route", () => {
    const markup = renderCommandBar("/library");

    expect(markup).toContain("Export Library selection");
    expect(markup).not.toContain("Favorite current vocabulary entry");
  });

  it("renders the keyboard shortcut reference", () => {
    const markup = renderToStaticMarkup(<KeyboardShortcutsDialog onClose={() => undefined} open />);

    expect(markup).toContain("Keyboard shortcuts");
    expect(markup).toContain("Open command bar");
    expect(markup).toContain("Export current context");
    expect(markup).toContain("Close overlay");
  });
});
