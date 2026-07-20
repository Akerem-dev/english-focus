import { describe, expect, it } from "vitest";

import maintainEntry from "../../../src/content/core/entries/maintain.entry.json";
import { parseActivityRecordList } from "../../../src/infrastructure/persistence/TauriActivityRepository";
import { parseStoredVocabularyEntryList } from "../../../src/infrastructure/persistence/TauriVocabularyRepository";

const validActivity = Object.freeze({
  id: "activity-valid",
  kind: "vocabulary-viewed",
  scope: "vocabulary",
  label: "Viewed maintain",
  target: "maintain",
  occurredAt: "2026-07-19T12:00:00.000Z"
});

describe("resilient local record parsing", () => {
  it("keeps valid vocabulary entries when another record is malformed", () => {
    const records = parseStoredVocabularyEntryList([
      { entry: maintainEntry, layer: "override" },
      { entry: { word: "broken" }, layer: "user" },
      { entry: maintainEntry, layer: "core" }
    ]);

    expect(records).toHaveLength(1);
    expect(records[0]?.entry.normalizedWord).toBe("maintain");
    expect(records[0]?.layer).toBe("override");
  });

  it("keeps valid recent activity when another record is malformed", () => {
    const records = parseActivityRecordList([
      validActivity,
      { ...validActivity, id: "bad-kind", kind: "unknown-event" },
      { ...validActivity, id: "bad-label", label: 42 }
    ]);

    expect(records).toEqual([validActivity]);
  });

  it("still rejects an invalid bridge response instead of pretending the list is empty", () => {
    expect(() => parseStoredVocabularyEntryList({ records: [] })).toThrow(
      "Stored vocabulary list response is invalid."
    );
    expect(() => parseActivityRecordList({ records: [] })).toThrow(
      "Recent activity list response is invalid."
    );
  });
});
