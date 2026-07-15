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
