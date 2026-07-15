import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  new URL("../../src/styles/vocabulary-detail.css", import.meta.url),
  "utf8"
);

const stickyNavRule = stylesheet.match(/\.vocabulary-detail-nav\s*\{([\s\S]*?)\}/)?.[1] ?? "";
const sectionRule = stylesheet.match(/\.vocabulary-section\s*\{([\s\S]*?)\}/)?.[1] ?? "";

describe("Vocabulary detail sticky section navigation", () => {
  it("sticks to the top of the scroll container without leaving a false topbar gap", () => {
    expect(stickyNavRule).toContain("top: 0;");
    expect(stickyNavRule).not.toContain("top: 4.75rem;");
  });

  it("uses an opaque surface and reserves anchor clearance for the sticky bar", () => {
    expect(stickyNavRule).toContain("background: var(--color-background);");
    expect(stickyNavRule).toContain("box-shadow: var(--shadow-low);");
    expect(sectionRule).toContain("scroll-margin-top: 4.75rem;");
  });
});
