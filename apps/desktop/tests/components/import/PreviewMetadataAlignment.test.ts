import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const styles = readFileSync(
  new URL("../../../src/styles/json-import.css", import.meta.url),
  "utf8"
);

describe("preview metadata alignment", () => {
  it("removes description-list indentation from provenance values", () => {
    expect(styles).toContain(".vocabulary-preview__provenance dd {");
    expect(styles).toContain("margin: 0;");
    expect(styles).toContain("text-align: left;");
  });

  it("aligns pronunciation content on a shared text baseline", () => {
    expect(styles).toContain(".vocabulary-preview__pronunciations article {");
    expect(styles).toContain("align-items: baseline;");
    expect(styles).toContain("justify-content: flex-start;");
  });
});
