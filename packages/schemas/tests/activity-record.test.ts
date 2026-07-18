import { describe, expect, it } from "vitest";

import { activityRecordSchema } from "../src/activity";

describe("activityRecordSchema", () => {
  it("accepts a privacy-safe local activity record", () => {
    expect(
      activityRecordSchema.parse({
        id: "activity-1",
        kind: "vocabulary-viewed",
        scope: "vocabulary",
        label: "Viewed vocabulary entry",
        target: "maintain",
        occurredAt: "2026-07-16T00:00:00.000Z"
      })
    ).toEqual(
      expect.objectContaining({
        kind: "vocabulary-viewed",
        target: "maintain"
      })
    );
  });

  it("accepts older desktop records whose optional target was stored as null", () => {
    expect(
      activityRecordSchema.parse({
        id: "activity-legacy",
        kind: "settings-updated",
        scope: "settings",
        label: "Settings updated",
        target: null,
        occurredAt: "2026-07-16T00:00:00.000Z"
      })
    ).toEqual({
      id: "activity-legacy",
      kind: "settings-updated",
      scope: "settings",
      label: "Settings updated",
      target: undefined,
      occurredAt: "2026-07-16T00:00:00.000Z"
    });
  });

  it("rejects arbitrary detail fields so notes and JSON cannot leak into history", () => {
    expect(() =>
      activityRecordSchema.parse({
        id: "activity-2",
        kind: "study-details-saved",
        scope: "vocabulary",
        label: "Study details saved",
        occurredAt: "2026-07-16T00:00:00.000Z",
        personalNote: "private text"
      })
    ).toThrow();
  });
});
