import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { vocabularyEntryInputSchema } from "@platform/schemas";
import { describe, expect, it } from "vitest";

import { inspectVocabularyContent } from "../../src/modules/import-export";

const fixturePath = resolve(
  process.cwd(),
  "../../testing/manual/cp13-maintain-user-duplicate.entry.json"
);

describe("CP13 manual duplicate fixture", () => {
  it("is compatibility-valid and semantically valid for maintain", () => {
    const raw: unknown = JSON.parse(readFileSync(fixturePath, "utf8"));
    const parsed = vocabularyEntryInputSchema.safeParse(raw);

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.examples).toHaveLength(3);
      const inspection = inspectVocabularyContent(parsed.data, "maintain");
      expect(inspection.blockingIssues).toHaveLength(0);
      expect(inspection.semanticPassed).toBe(true);
      expect(inspection.canContinue).toBe(true);
    }
  });
});
