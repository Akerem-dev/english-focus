import { describe, expect, it } from "vitest";

import { createDefaultAppSettings } from "../../../src/modules/settings/application";
import { resolveTheme } from "../../../src/modules/settings/state";

describe("application settings", () => {
  it("creates deterministic V1 defaults", () => {
    const settings = createDefaultAppSettings("2026-07-15T18:00:00.000Z");

    expect(settings.schemaVersion).toBe("1.0.0");
    expect(settings.content.exampleSentenceCount).toBe(10);
    expect(settings.appearance.theme).toBe("system");
    expect(settings.instruction.exampleCount).toBe(10);
  });

  it("resolves the system theme without overriding explicit choices", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});
