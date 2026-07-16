import { describe, expect, it } from "vitest";

import { createErrorReference } from "../../../src/app/errors";
import { getDocumentTitle } from "../../../src/app/performance";

describe("release hardening helpers", () => {
  it("creates privacy-safe stable references for one failure instant", () => {
    const first = createErrorReference(new Error("private note must not leak"), 123456);
    const second = createErrorReference(new Error("different private content"), 123456);

    expect(first).toMatch(/^EF-[A-Z0-9]{7}$/);
    expect(second).toBe(first);
    expect(first).not.toContain("private");
  });

  it("uses clear route-aware document titles", () => {
    expect(getDocumentTitle("Vocabulary")).toBe("Vocabulary — English Focus");
    expect(getDocumentTitle("Settings")).toBe("Settings — English Focus");
  });
});
