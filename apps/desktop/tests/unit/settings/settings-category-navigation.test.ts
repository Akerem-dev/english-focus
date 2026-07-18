import { describe, expect, it } from "vitest";

import {
  SETTINGS_CATEGORY_IDS,
  resolveSettingsCategoryNavigation
} from "../../../src/modules/settings/application";

describe("settings category keyboard navigation", () => {
  it("moves through the ordered categories with arrow keys", () => {
    expect(resolveSettingsCategoryNavigation("general", "ArrowDown")).toBe("content");
    expect(resolveSettingsCategoryNavigation("content", "ArrowRight")).toBe("data");
    expect(resolveSettingsCategoryNavigation("privacy", "ArrowDown")).toBe("general");
    expect(resolveSettingsCategoryNavigation("general", "ArrowLeft")).toBe("privacy");
  });

  it("supports Home and End without reacting to unrelated keys", () => {
    expect(resolveSettingsCategoryNavigation("data", "Home")).toBe(SETTINGS_CATEGORY_IDS[0]);
    expect(resolveSettingsCategoryNavigation("general", "End")).toBe(
      SETTINGS_CATEGORY_IDS[SETTINGS_CATEGORY_IDS.length - 1]
    );
    expect(resolveSettingsCategoryNavigation("content", "Enter")).toBeUndefined();
  });
});
