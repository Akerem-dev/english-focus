import { describe, expect, it } from "vitest";

import {
  activityKindLabel,
  activityScopeLabel,
  formatActivityTime
} from "../../../src/modules/history";

describe("activity presentation", () => {
  it("formats privacy-safe activity labels", () => {
    expect(activityKindLabel("vocabulary-viewed")).toBe("Vocabulary viewed");
    expect(activityScopeLabel("backup")).toBe("Backup");
  });

  it("formats recent timestamps without exposing raw storage details", () => {
    expect(
      formatActivityTime("2026-07-16T00:00:00.000Z", new Date("2026-07-16T00:05:00.000Z"))
    ).toBe("5 min ago");
  });
});
