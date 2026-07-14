import { describe, expect, it } from "vitest";

import { CURRENT_VOCABULARY_SCHEMA_VERSION, detectSchemaVersion } from "../src/migrations";

describe("schema version detection", () => {
  it("detects the current supported entry version", () => {
    expect(detectSchemaVersion({ schemaVersion: "1.0.0" })).toBe("1.0.0");
    expect(CURRENT_VOCABULARY_SCHEMA_VERSION).toBe("1.0.0");
  });

  it("returns null for missing or unsupported versions", () => {
    expect(detectSchemaVersion({})).toBeNull();
    expect(detectSchemaVersion({ schemaVersion: "2.0.0" })).toBeNull();
    expect(detectSchemaVersion(null)).toBeNull();
  });
});
