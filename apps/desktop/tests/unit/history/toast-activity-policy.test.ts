import { describe, expect, it } from "vitest";

import { resolveToastActivity } from "../../../src/app/providers/toastActivityPolicy";

describe("toast activity policy", () => {
  it("uses stable operation keys instead of visible toast titles", () => {
    const first = resolveToastActivity({
      title: "Vocabulary JSON exported",
      tone: "success",
      dedupeKey: "vocabulary-export"
    });
    const renamed = resolveToastActivity({
      title: "Your vocabulary file is ready",
      tone: "success",
      dedupeKey: "vocabulary-export"
    });

    expect(renamed).toEqual(first);
    expect(first).toEqual({
      kind: "export-created",
      scope: "vocabulary",
      label: "Vocabulary export created"
    });
  });

  it("does not treat a successful vocabulary save toast as the persistence event", () => {
    expect(
      resolveToastActivity({
        title: "Vocabulary saved locally",
        tone: "success",
        dedupeKey: "vocabulary-persistence"
      })
    ).toBeUndefined();

    expect(
      resolveToastActivity({
        title: "Existing entry kept",
        tone: "info",
        dedupeKey: "vocabulary-persistence"
      })
    ).toEqual({
      kind: "entry-kept",
      scope: "vocabulary",
      label: "Existing vocabulary entry kept"
    });
  });

  it("keeps generic warnings and failures independent from their wording", () => {
    expect(resolveToastActivity({ title: "Any warning copy", tone: "warning" })).toEqual({
      kind: "operation-warning",
      scope: "system",
      label: "An operation needs attention"
    });
    expect(resolveToastActivity({ title: "Any failure copy", tone: "error" })).toEqual({
      kind: "operation-failed",
      scope: "system",
      label: "An operation failed"
    });
  });

  it("ignores ordinary informational notifications", () => {
    expect(resolveToastActivity({ title: "Nothing persisted", tone: "info" })).toBeUndefined();
  });
});
