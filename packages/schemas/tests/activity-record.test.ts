import { describe, expect, it } from "vitest";

import { activityRecordSchema, parseActivityRecordList } from "../src/activity";

const baseRecord = {
  id: "activity-1",
  kind: "vocabulary-viewed",
  scope: "vocabulary",
  label: "Viewed vocabulary entry",
  occurredAt: "2026-07-16T00:00:00.000Z"
} as const;

describe("activityRecordSchema", () => {
  it("accepts a privacy-safe local activity record", () => {
    expect(
      activityRecordSchema.parse({
        ...baseRecord,
        target: "maintain"
      })
    ).toEqual(
      expect.objectContaining({
        kind: "vocabulary-viewed",
        target: "maintain"
      })
    );
  });

  it("normalizes a native null target to an omitted optional value", () => {
    expect(
      activityRecordSchema.parse({
        ...baseRecord,
        target: null
      })
    ).toEqual({
      ...baseRecord,
      target: undefined
    });
  });

  it("keeps valid records when one legacy row is malformed", () => {
    expect(
      parseActivityRecordList([
        { ...baseRecord, target: null },
        { ...baseRecord, id: "activity-2", label: null },
        { ...baseRecord, id: "activity-3", target: "protect" }
      ])
    ).toEqual({
      records: [
        { ...baseRecord, target: undefined },
        { ...baseRecord, id: "activity-3", target: "protect" }
      ],
      skippedCount: 1
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
