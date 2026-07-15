import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const styles = readFileSync(
  new URL("../../../src/styles/json-import.css", import.meta.url),
  "utf8"
);

describe("duplicate summary alignment", () => {
  it("removes the browser default description-list indentation", () => {
    expect(styles).toContain(".duplicate-check__new-summary dd,");
    expect(styles).toContain("margin: 0;");
    expect(styles).toContain("text-align: left;");
  });
});
