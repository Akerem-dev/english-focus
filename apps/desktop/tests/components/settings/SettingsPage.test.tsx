import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  InstructionPreferencesProvider,
  SettingsProvider
} from "../../../src/app/providers";
import { SettingsPage } from "../../../src/modules/settings/pages";

describe("SettingsPage", () => {
  it("renders persistent content, data, appearance, instruction, and diagnostics settings", () => {
    const markup = renderToStaticMarkup(
      <SettingsProvider>
        <InstructionPreferencesProvider>
          <SettingsPage />
        </InstructionPreferencesProvider>
      </SettingsProvider>
    );

    expect(markup).toContain("Settings");
    expect(markup).toContain("Show etymology");
    expect(markup).toContain("Automatic backups");
    expect(markup).toContain("Reduced motion");
    expect(markup).toContain("AI instruction");
    expect(markup).toContain("Settings schema");
    expect(markup).toContain("Loading settings");
  });
});
